<?php

namespace REES\Inc;


defined( 'ABSPATH' ) || exit;

class REES_Content {

	protected $template_path = 'rees-real-estate-for-woo';
	protected $default_path = REES_CONST_F['plugin_dir'] . 'templates/';
	protected $currency_symbol;

	protected static $setting;
	protected static $instance = null;

	private function __construct() {
		add_action( 'wp_ajax_nopriv_woore_get_tour', array( $this, 'get_tour' ) );
		add_action( 'wp_ajax_woore_get_tour', array( $this, 'get_tour' ) );
		add_action( 'wp_ajax_woore_contact_agent_ajax', array( $this, 'contact_agent_ajax' ) );
		add_action( 'wp_ajax_nopriv_woore_contact_agent_ajax', array( $this, 'contact_agent_ajax' ) );
		add_action( 'init', array( $this, 'mortgage_calculator_shortcode_init' ) );
		$this->currency_symbol = get_woocommerce_currency_symbol( get_woocommerce_currency() );
		self::$setting         = Data::get_instance();
		add_filter( 'woore_add_unit_size', array( $this, 'add_param_for_fun_get_price_html' ) );
		$this->handle_position_components( self::$setting->get_params( 'property_components' ) );
	}


	public static function instance() {
		return null === self::$instance ? self::$instance = new self() : self::$instance;
	}

	function handle_position_components( $position ) {
		switch ( $position ) {
			case 'in':
				add_filter( 'woocommerce_product_tabs', array( $this, 'real_estate_product_tabs_filter' ) );
				break;
			case 'in_des':
				add_filter( 'woocommerce_product_tabs', function ( $tabs ) {
					$tabs['description'] = array(
						'title'    => esc_html__( 'Description', 'rees-real-estate-for-woo' ),
						'priority' => 10,
						'callback' => 'woocommerce_product_description_tab',
					);

					return $tabs;
				} );
				add_filter( 'woocommerce_product_description_heading', array( $this, 'real_estate_front_summary' ) );
				break;
			default:
				add_action( 'woocommerce_after_single_product_summary', array(
					$this,
					'real_estate_front_summary'
				), 9 );
		}
	}

	function add_param_for_fun_get_price_html() {
		return self::$setting->get_params( 'unit_size' ) === 'cs' ? self::$setting->get_params( 'custom_unit_size' ) : self::$setting->get_params( 'unit_size' );
	}

	function mortgage_calculator_shortcode_init() {
		add_shortcode( 'woore_mortgage_calculator', array( $this, 'shortcode_mortgage_calculator' ) );
	}

	function shortcode_mortgage_calculator( $atts ) {
		if ( ! defined( 'mortgage_calculator_defined' ) ) {
			define( 'mortgage_calculator_defined', true );
		} else {
			return '';
		}

		$params = array(
			'currencySymbol' => get_woocommerce_currency_symbol( get_woocommerce_currency() ),
			'decimals'       => wc_get_price_decimals(),
			'dec_point'      => wc_get_price_decimal_separator(),
			'thousands_sep'  => wc_get_price_thousand_separator(),
			'i18n'           => I18n::init(),
		);
		wp_enqueue_style( 'woore-mortgage-cal-shortcode-style', REES_CONST_F['css_url'] . 'mortgage-cal-shortcode.css', '', REES_CONST_F['version'] );
		wp_enqueue_script( 'woore-mortgage-cal-shortcode-script', REES_CONST_F['js_url'] . 'mortgage-cal-shortcode.js', array( 'jquery' ), REES_CONST_F['version'], true );
		wp_localize_script( 'woore-mortgage-cal-shortcode-script', 'VicWreMortCalParams', $params );

		$arr = shortcode_atts( array(
			'property_price' => '',
		), $atts );

		$args = array(
			'currency_symbol' => $this->currency_symbol,
			'property_price'  => $arr['property_price'],
			'interest_rate'   => self::$setting->get_params( 'interest_rate' ),
			'repayment_year'  => self::$setting->get_params( 'repayment_year' ),
		);

		return wc_get_template_html( 'rees-mortgage-calculator.php', $args, $this->template_path, $this->default_path );

	}

	function real_estate_front_summary() {
		global $product;

		$order_of_components = self::$setting->get_params( 'order_of_components' );
		if ( 'real-estate' === $product->get_type() ) {

			$_product = new \REES_Product_Real_Estate( $product->get_id() ); // Remove "Potentially polymorphic call" warning

			echo '<div class="woore-page">';
			foreach ( $order_of_components as $component ) {
				$method_name = 'get_' . $component . '_template';
				call_user_func( array( $this, $method_name ), $_product );
			}
			echo '</div>';

		}
	}

	function real_estate_product_tabs_filter( $tabs ) {
		global $product;

		if ( 'real-estate' === $product->get_type() ) {
			$tabs['property_info'] = array(
				'title'    => esc_html__( 'Property Information', 'rees-real-estate-for-woo' ),
				'priority' => 5,
				'callback' => function () {
					call_user_func( array( $this, 'real_estate_front_summary' ) );
				},
			);

		}

		return $tabs;
	}

	function get_overview_template( $_product ) {
		$args = array(
			'unit_size'      => self::$setting->get_params( 'unit_size' ) === 'cs' ? self::$setting->get_params( 'custom_unit_size' ) : self::$setting->get_params( 'unit_size' ),
			'unit_land_area' => self::$setting->get_params( 'unit_land_area' ) === 'cs' ? self::$setting->get_params( 'custom_unit_land_area' ) : self::$setting->get_params( 'unit_land_area' ),
		);

		$main_args = array(
			'property_year_built'        => $_product->get_woorealestate_year_built(),
			'property_size'              => $_product->get_woorealestate_size(),
			'property_land_area'         => $_product->get_woorealestate_land_area(),
			'property_bedrooms'          => $_product->get_woorealestate_bedrooms(),
			'property_bathrooms'         => $_product->get_woorealestate_bathrooms(),
			'property_additional_detail' => apply_filters( 'woore_woorealestate_additional_detail', $_product->get_meta( 'woorealestate_additional_detail' ) ),
		);

		$filtered_main_array = array_filter( $main_args );

		$args = array_merge( $args, $main_args );

		if ( ! empty( $filtered_main_array ) ) {
			wc_get_template( 'rees-overview.php', $args, $this->template_path, $this->default_path );
		}

		return false;
	}

	function get_address_template( $_product ) {

		$country      = WC()->countries->get_base_country();
		$name_country = ! empty( $_product->get_woorealestate_country() ) ? WC()->countries->get_countries()[ $_product->get_woorealestate_country() ] : WC()->countries->get_countries()[ $country ];
		$main_args    = array(
			'property_full_address' => $_product->get_woorealestate_full_address(),
			'property_country'      => $name_country,
			'property_location'     => $_product->get_meta( 'woorealestate_property_location' ),
			'property_state'        => $_product->get_woorealestate_state(),
			'property_city'         => $_product->get_woorealestate_city(),
			'property_neighborhood' => $_product->get_woorealestate_neighborhood(),
			'property_zip'          => $_product->get_woorealestate_zip(),
		);

		$filtered_array = array_filter( $main_args );

		$args = array_merge( $main_args, array( 'google_map_api' => self::$setting->get_params( 'google_map_api_key' ) ) );

		if ( ! empty( $filtered_array ) ) {
			wc_get_template( 'rees-address.php', $args, $this->template_path, $this->default_path );
		}

		return false;
	}

	function get_travel_time_template( $_product ) {

		$args = array(
			'property_full_address' => $_product->get_woorealestate_full_address(),
			'property_location'     => $_product->get_meta( 'woorealestate_property_location' ),
			'position_component'    => self::$setting->get_params( 'property_components' ),
		);
		if ( ! empty( self::$setting->get_params( 'enable_travel_time' ) ) && ! empty( $args['property_location'] ) ) {
			wc_get_template( 'rees-travel-time.php', $args, $this->template_path, $this->default_path );
		}

		return false;
	}

	function get_feature_template( $_product ) {
		$args = array(
			'property_feature' => get_the_terms( $_product->get_id(), 'woore-feature' ),
		);
		if ( $args['property_feature'] ) {
			wc_get_template( 'rees-feature.php', $args, $this->template_path, $this->default_path );
		}

		return false;
	}

	function get_video_template( $_product ) {

		$args = array(
			'property_video_image' => $_product->get_meta( 'woorealestate_video_image' ),
			'property_video_url'   => $_product->get_meta( 'woorealestate_video_url' ),
		);

		$video_type = '';

		if ( ! empty( $args['property_video_url'] ) ) {
			$file_path    = pathinfo( $args['property_video_url'] );

			// https://developers.google.com/youtube/iframe_api_reference
			// https://developers.google.com/youtube/terms/api-services-terms-of-service
			$youtube_text = 'https://www.youtube.com/embed';

			// https://developer.vimeo.com/player/sdk/basics
			// https://developer.vimeo.com/guidelines/terms
			$vimeo_text   = 'https://player.vimeo.com/video';

			if ( str_contains( $file_path['dirname'], $youtube_text ) ||
			     str_contains( $file_path['dirname'], $vimeo_text ) ) {
				$video_type = 'link';
			} else if ( isset( $file_path['extension'] ) ) {

				if ( attachment_url_to_postid( $args['property_video_url'] ) ) {
					if ( 'mp4' === $file_path['extension'] ||
					     'webm' === $file_path['extension'] ||
					     'ogv' === $file_path['extension'] ) {
						$video_type = 'video';
					}
				}
			}

			if ( ! empty( $video_type ) ) {
				$args['video_type'] = $video_type;

				wc_get_template( 'rees-video.php', $args, $this->template_path, $this->default_path );
			}
		}

		return false;
	}

	function get_virtual_tour_template( $_product ) {
		wc_get_template( 'rees-virtual-tour.php', array(), $this->template_path, $this->default_path );
	}

	function get_nearby_places_template( $_product ) {
		$args = array(
			'property_location'   => $_product->get_meta( 'woorealestate_property_location' ),
			'nearby_places_field' => $this->handle_nearby_places_field(),
		);
		if ( ! empty( self::$setting->get_params( 'enable_nearby_places' ) ) &&
		     ! empty( $args['property_location'] ) &&
		     ! empty( $args['nearby_places_field'] ) ) {
			wc_get_template( 'rees-nearby-places.php', $args, $this->template_path, $this->default_path );
		}

		return false;
	}

	function get_floor_plans_template( $_product ) {
		$args = array(
			'property_floor_plan' => $_product->get_meta( 'woorealestate_property_floor' ),
			'unit_size'           => self::$setting->get_params( 'unit_size' ) === 'cs' ? self::$setting->get_params( 'custom_unit_size' ) : self::$setting->get_params( 'unit_size' ),
		);

		if ( is_array( $args['property_floor_plan'] ) ) {
			$args['property_floor_plan'] = array_filter( $args['property_floor_plan'], function ( $floor ) {
				return $floor['image_id'] && $floor['name'];
			} );
		}

		if ( $args['property_floor_plan'] ) {
			wc_get_template( 'rees-floor-plans.php', $args, $this->template_path, $this->default_path );
		}

		return false;
	}

	function get_file_attachment_template( $_product ) {
		$args = array(
			'property_file_attachment' => $_product->get_meta( 'woorealestate_file_attach' ),
			'style'                    => self::$setting->get_params( 'style_file_attachment' ),
			'position_component'       => self::$setting->get_params( 'property_components' ),
		);

		if ( $args['property_file_attachment'] ) {
			wc_get_template( 'rees-file-attachment.php', $args, $this->template_path, $this->default_path );
		}

		return false;
	}

	function get_contact_template( $_product ) {
		$user_id   = self::$setting->get_params( 'admin_contact' );
		$user_info = get_user_by( 'ID', $user_id );
		$args      = array(
			'property_name'         => get_the_title( $_product->get_id() ),
			'property_url'          => get_permalink( $_product->get_id() ),
			'user_avatar_url'       => get_avatar_url( $user_id ),
			'user_display_name'     => $user_info->display_name,
			'user_email'            => $user_info->user_email,
			'user_url'              => $user_info->user_url,
			'woore_info_mobile'     => get_user_meta( $user_id, 'woore_info_mobile', true ),
			'woore_info_fax_number' => get_user_meta( $user_id, 'woore_info_fax_number', true ),
			'social_links'          => array(
				'skype'     => get_user_meta( $user_id, 'woore_info_skype', true ),
				'facebook'  => get_user_meta( $user_id, 'woore_social_facebook', true ),
				'x'         => get_user_meta( $user_id, 'woore_social_twitter', true ),
				'linkedin'  => get_user_meta( $user_id, 'woore_social_linkedin', true ),
				'pinterest' => get_user_meta( $user_id, 'woore_social_pinterest', true ),
				'instagram' => get_user_meta( $user_id, 'woore_social_instagram', true ),
				'youtube'   => get_user_meta( $user_id, 'woore_social_youtube', true ),
				'vimeo'     => get_user_meta( $user_id, 'woore_social_vimeo', true ),
			),
			'woore_recaptcha'       => self::$setting->get_params( 'enable_google_recaptcha' ),
		);

		wc_get_template( 'rees-contact.php', $args, $this->template_path, $this->default_path );
	}

	function get_mortgage_calculator_template( $_product ) {
		$property_price = $_product->get_price();

		if ( ! empty( self::$setting->get_params( 'mortgage_calculator' ) ) && ! empty( $property_price ) ) {
			echo do_shortcode( '[woore_mortgage_calculator property_price=' . $property_price . ']' );
		}

		return false;
	}

	function handle_nearby_places_field() {
		$fields        = self::$setting->get_params( 'nearby_places_field' );
		$default_field = self::$setting->get_nearby_places_type_default();

		$new_fields = array();
		foreach ( $fields as $field ) {
			$new_fields[ $field ] = $default_field[ $field ];
		}

		return $new_fields;
	}

	function get_tour() {
		if ( isset( $_GET['post_id'], $_GET['nonce'] ) && wp_verify_nonce( sanitize_key( $_GET['nonce'] ), 'woorealestate_nonce' ) ) {
			$post_id   = sanitize_text_field( wp_unslash( $_GET['post_id'] ) );
			$data      = get_post_meta( $post_id, 'woore_tour_data', true );
			$json_data = wp_json_encode( $data );
			wp_send_json( $json_data );
		} else {
			wp_send_json_error( "Get data failure" );
		}
		wp_die();
	}

	function contact_agent_ajax() {
		if ( ! ( isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'woorealestate_nonce' ) ) ) {
			return;
		}

		$sender_phone = isset( $_POST['woore_sender_phone'] ) ? wc_clean( wp_unslash( $_POST['woore_sender_phone'] ) ) : '';

		$target_email = isset( $_POST['woore_target_email'] ) ? sanitize_email( wp_unslash( $_POST['woore_target_email'] ) ) : '';
		$property_url = isset( $_POST['woore_property_url'] ) ? sanitize_url( wp_unslash( $_POST['woore_property_url'] ) ) : '';
		$target_email = is_email( $target_email );
		if ( ! $target_email ) {
			wp_send_json_error( esc_html__( 'Target Email address is not properly configured!', 'rees-real-estate-for-woo' ) );
			wp_die();
		}
		//recaptcha
		if ( self::$setting->get_params( 'enable_google_recaptcha' ) && ( self::$setting->get_params( 'recaptcha_version' ) == 3 ) ) {
			if ( ! $this->verify() ) {
				wp_send_json_error( esc_html__( 'Captcha Invalid', 'rees-real-estate-for-woo' ) );
				wp_die();
			}
		}

		$sender_email = isset( $_POST['woore_sender_email'] ) ? sanitize_email( wp_unslash( $_POST['woore_sender_email'] ) ) : '';

		$sender_name = isset( $_POST['woore_sender_name'] ) ? wc_clean( wp_unslash( $_POST['woore_sender_name'] ) ) : '';
		$sender_msg  = isset( $_POST['woore_sender_msg'] ) ? wp_kses_post( wp_unslash( $_POST['woore_sender_msg'] ) ) : '';
		// translators: %1$s is a placeholder for sender's name, %2$s is a placeholder for site name
		$email_subject = sprintf( esc_html__( 'New message sent by %1$s using contact form at %2$s', 'rees-real-estate-for-woo' ), $sender_name, get_bloginfo( 'name' ) );

		$email_body = esc_html__( 'You have received a message from: ', 'rees-real-estate-for-woo' ) . esc_html( $sender_name ) . " <br/>";
		if ( ! empty( $sender_phone ) ) {
			$email_body .= esc_html__( 'Phone Number : ', 'rees-real-estate-for-woo' ) . esc_html( $sender_phone ) . " <br/>";
		}
		if ( ! empty( $property_url ) ) {
			$email_body .= esc_html__( 'Property Url: ', 'rees-real-estate-for-woo' ) . '<a href="' . esc_url( $property_url ) . '">' . esc_url( $property_url ) . '</a><br/>';
		}
		$email_body .= esc_html__( 'Additional message is as follows.', 'rees-real-estate-for-woo' ) . " <br/>";
		$email_body .= wpautop( $sender_msg ) . " <br/>";
		// translators: %1$s is a placeholder for sender's name, %2$s is a placeholder for sender's email
		$email_body .= sprintf( esc_html__( 'You can contact %1$s via email %2$s', 'rees-real-estate-for-woo' ), $sender_name, $sender_email );

		$header = 'Content-type: text/html; charset=utf-8' . "\r\n";
		$header .= 'From: ' . $sender_name . " <" . $sender_email . "> \r\n";

		if ( wc_mail( $target_email, $email_subject, $email_body, $header ) ) {
			wp_send_json_success( esc_html__( 'Message Sent Successfully!', 'rees-real-estate-for-woo' ) );
		} else {
			wp_send_json_error( esc_html__( 'Server Error: WordPress mail function failed!', 'rees-real-estate-for-woo' ) );
		}
		wp_die();
	}

	function verify() {
		if ( isset( $_POST['g-recaptcha-response'], $_POST['nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'woorealestate_nonce' ) ) {
			$captcha_secret_key = self::$setting->get_params( 'secret_key' );
			$response           = wp_remote_get( "https://www.google.com/recaptcha/api/siteverify?secret=" . $captcha_secret_key . "&response=" . wc_clean( wp_unslash( $_POST['g-recaptcha-response'] ) ) );
			$response           = json_decode( $response["body"], true );

			return true == $response["success"];
		}

		return true;
	}
}