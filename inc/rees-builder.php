<?php

namespace REES\Inc;

defined( 'ABSPATH' ) || exit;

class REES_Builder {

	protected static $instance = null;
	private static $setting;

	private function __construct() {

		self::$setting = Data::get_instance( true );

		//Tạo taxonomy Property Feature
		add_action( 'init', array( $this, 'create_property_feature_taxonomy' ) );
		add_filter( 'wp_insert_term_data', array( $this, 'limit_feature_taxonomy_hierarchy' ), 10, 2 );

		add_action( 'init', array( $this, 'register_real_estate_product_type' ) );
		add_filter( 'woocommerce_product_class', array( $this, 'rees_woocommerce_product_class' ), 10, 2 );
		add_filter( 'product_type_selector', array( $this, 'add_real_estate_product_type' ) );
		add_action( 'woocommerce_product_options_general_product_data', array(
			$this,
			'add_basic_information_for_general_tab'
		) );
		add_filter( 'woocommerce_product_data_tabs', array( $this, 'real_estate_product_tab' ), 10, 1 );
		add_action( 'woocommerce_product_data_panels', array( $this, 'real_estate_product_tab_content' ) );
		add_action( 'woocommerce_admin_process_product_object', array(
			$this,
			'real_estate_process_product_object'
		) );
		add_action( 'wp_ajax_woore_save_virtual_tour', array( $this, 'save_virtual_tour' ) );
		add_action( 'wp_ajax_woore_get_virtual_tour', array( $this, 'get_virtual_tour' ) );
	}

	public static function instance() {
		return null === self::$instance ? self::$instance = new self() : self::$instance;
	}

	function rees_woocommerce_product_class( $classname, $product_type ) {
		if ( 'real-estate' === $product_type ) {
			$classname = 'REES_Product_Real_Estate';
		}

		return $classname;
	}

	function create_property_feature_taxonomy() {
		$label = array(
			'name'          => esc_html__( 'Features', 'rees-real-estate-for-woo' ),
			'singular_name' => esc_html__( 'Feature', 'rees-real-estate-for-woo' ),
			'search_items'  => esc_html__( 'Search Features', 'rees-real-estate-for-woo' ),
			'all_items'     => esc_html__( 'All Features', 'rees-real-estate-for-woo' ),
			'edit_item'     => esc_html__( 'Edit Feature', 'rees-real-estate-for-woo' ),
			'view_item'     => esc_html__( 'View Feature', 'rees-real-estate-for-woo' ),
			'update_item'   => esc_html__( 'Update Feature', 'rees-real-estate-for-woo' ),
			'add_new_item'  => esc_html__( 'Add New Feature', 'rees-real-estate-for-woo' ),
			'new_item_name' => esc_html__( 'New Feature Name', 'rees-real-estate-for-woo' ),
			'menu_name'     => esc_html__( 'Features', 'rees-real-estate-for-woo' ),
		);

		$arg = array(
			'hierarchical'      => true,
			'labels'            => $label,
			'show_ui'           => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => 'woore-feature' ),
		);

		register_taxonomy( 'woore-feature', array( 'product' ), $arg );
	}

	function limit_feature_taxonomy_hierarchy( $data, $taxonomy ) {

		if ( isset( $_POST['_rees_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_rees_nonce'] ) ), 'wrealestate_nonce' ) ) {
			if ( isset ( $_POST['taxonomy'] ) && 'woore-feature' === $taxonomy && $_POST['taxonomy'] === $taxonomy && ! empty ( $_POST['parent'] ) ) {
				$parent_term = get_term( sanitize_text_field( wp_unslash( $_POST['parent'] ) ), $taxonomy );

				if ( $parent_term instanceof \WP_Term && $parent_term->parent ) {
					wp_die( esc_html__( 'Only 2 hierarchies are allowed for taxonomy ', 'rees-real-estate-for-woo') . esc_html( $taxonomy ) );
				}
			}
		}

		return $data;
	}

	function register_real_estate_product_type() {
		require_once REES_CONST_F['plugin_dir'] . '/inc/models/rees-product-real-estate.php';

	}

	function add_real_estate_product_type( $types ) {
		$types['real-estate'] = esc_html__( 'Real Estate product', 'rees-real-estate-for-woo' );

		return $types;
	}

	function add_basic_information_for_general_tab() {
		global $post;
		$additional_detail = get_post_meta( $post->ID, 'woorealestate_additional_detail', true );
		$real_estate_type  = get_post_meta( $post->ID, '_woorealestate_type', true );
		$unit_land_area    = self::$setting->get_params( 'unit_land_area' ) === 'cs' ? self::$setting->get_params( 'custom_unit_land_area' ) : self::$setting->get_params( 'unit_land_area' );
		$unit_size         = self::$setting->get_params( 'unit_size' ) === 'cs' ? self::$setting->get_params( 'custom_unit_size' ) : self::$setting->get_params( 'unit_size' );
		echo '<div class="options_group show_if_real-estate">';
		include_once plugin_dir_path( __FILE__ ) . 'views/real-estate/rees-basic-information.php';
		echo '</div>';
	}

	function real_estate_product_tab( $tabs ) {

		$tabs['shipping']['class'][] = 'hide_if_real-estate';

		$tabs['location'] = array(
			'label'    => esc_html__( 'Location', 'rees-real-estate-for-woo' ),
			'target'   => 'real_estate_location_options',
			'class'    => 'show_if_real-estate',
			'priority' => 10,
		);

		$tabs['floors-plan'] = array(
			'label'    => esc_html__( 'Floors Plan', 'rees-real-estate-for-woo' ),
			'target'   => 'real_estate_floors_options',
			'class'    => 'show_if_real-estate',
			'priority' => 10,
		);

		$tabs['file-attachment'] = array(
			'label'    => esc_html__( 'File Attachments', 'rees-real-estate-for-woo' ),
			'target'   => 'real_estate_file_options',
			'class'    => 'show_if_real-estate',
			'priority' => 10,
		);

		$tabs['virtual-tour'] = array(
			'label'    => esc_html__( 'Virtual Tour', 'rees-real-estate-for-woo' ),
			'target'   => 'real_estate_tour_options',
			'class'    => 'show_if_real-estate',
			'priority' => 10,
		);

		$tabs['video'] = array(
			'label'    => esc_html__( 'Video', 'rees-real-estate-for-woo' ),
			'target'   => 'real_estate_video_options',
			'class'    => 'show_if_real-estate',
			'priority' => 10,
		);

		return $tabs;
	}

	function real_estate_product_tab_content() {
		global $post;
		$additional_detail               = get_post_meta( $post->ID, 'woorealestate_additional_detail', true );
		$woore_floor                     = get_post_meta( $post->ID, 'woorealestate_property_floor', true );
		$woore_file_attach               = get_post_meta( $post->ID, 'woorealestate_file_attach', true );
		$woorealestate_video_image       = get_post_meta( $post->ID, 'woorealestate_video_image', true );
		$woorealestate_video_url         = get_post_meta( $post->ID, 'woorealestate_video_url', true );
		$unit_land_area                  = self::$setting->get_params( 'unit_land_area' ) === 'cs' ? self::$setting->get_params( 'custom_unit_land_area' ) : self::$setting->get_params( 'unit_land_area' );
		$unit_size                       = self::$setting->get_params( 'unit_size' ) === 'cs' ? self::$setting->get_params( 'custom_unit_size' ) : self::$setting->get_params( 'unit_size' );
		$map_api_key_option              = self::$setting->get_params( 'google_map_api_key' ) ?: '';
		$woore_tour_settings             = get_post_meta( $post->ID, 'woore_tour_settings', true );
		$woorealestate_property_location = get_post_meta( $post->ID, 'woorealestate_property_location', true );
		$woorealestate_video_local_id    = get_post_meta( $post->ID, 'woorealestate_video_local_id', true );
		$woorealestate_video_type        = get_post_meta( $post->ID, 'woorealestate_video_type', true );
		$woorealestate_country           = get_post_meta( $post->ID, '_woorealestate_country', true );

		include_once plugin_dir_path( __FILE__ ) . 'views/real-estate/rees-location.php';
		include_once plugin_dir_path( __FILE__ ) . 'views/real-estate/rees-floors-plan.php';
		include_once plugin_dir_path( __FILE__ ) . 'views/real-estate/rees-file-attachments.php';
		include_once plugin_dir_path( __FILE__ ) . 'views/real-estate/rees-video.php';
		include_once plugin_dir_path( __FILE__ ) . 'views/real-estate/rees-virtual-tour.php';
	}

	function real_estate_process_product_object( $product ) {
		if ( ! isset( $_POST['_rees_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_rees_nonce'] ) ), 'wrealestate_nonce' ) ) {
			return;
		}

		if ( isset( $_POST['_downloadable'] ) ) {
			$product->set_downloadable( 'no' );
		}
		if ( isset( $_POST['_virtual'] ) ) {
			$product->set_virtual( 'no' );
		}

		$errors = $product->set_props(
			array(
				'woorealestate_type'         => isset( $_POST['_woorealestate_type'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_type'] ) ) : null,
				'woorealestate_price_suffix' => isset( $_POST['_woorealestate_price_suffix'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_price_suffix'] ) ) : null,
				'woorealestate_deposit'      => isset( $_POST['_woorealestate_deposit'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_deposit'] ) ) : null,
				'woorealestate_size'         => isset( $_POST['_woorealestate_size'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_size'] ) ) : null,
				'woorealestate_land_area'    => isset( $_POST['_woorealestate_land_area'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_land_area'] ) ) : null,
				'woorealestate_rooms'        => isset( $_POST['_woorealestate_rooms'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_rooms'] ) ) : null,
				'woorealestate_bedrooms'     => isset( $_POST['_woorealestate_bedrooms'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_bedrooms'] ) ) : null,
				'woorealestate_bathrooms'    => isset( $_POST['_woorealestate_bathrooms'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_bathrooms'] ) ) : null,
				'woorealestate_year_built'   => isset( $_POST['_woorealestate_year_built'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_year_built'] ) ) : null,
				'woorealestate_state'        => isset( $_POST['_woorealestate_state'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_state'] ) ) : null,
				'woorealestate_city'         => isset( $_POST['_woorealestate_city'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_city'] ) ) : null,
				'woorealestate_country'      => isset( $_POST['_woorealestate_country'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_country'] ) ) : null,
				'woorealestate_neighborhood' => isset( $_POST['_woorealestate_neighborhood'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_neighborhood'] ) ) : null,
				'woorealestate_zip'          => isset( $_POST['_woorealestate_zip'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_zip'] ) ) : null,
				'woorealestate_full_address' => isset( $_POST['_woorealestate_full_address'] ) ? wc_clean( wp_unslash( $_POST['_woorealestate_full_address'] ) ) : null,
			)
		);

		$woorealestate_additional_detail = isset( $_POST['woorealestate_additional_detail'] ) ? wp_kses_post( wp_unslash( $_POST['woorealestate_additional_detail'] ) ) : null;

		//phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$woorealestate_property_floor = isset( $_POST['woorealestate_property_floor'] ) ? array_values( array_map( function ( $floor ) {
			foreach ( $floor as $key => $value ) {
				if ( 'additional_detail' !== $key ) {
					$floor[ $key ] = wc_clean( $value );
				} else {
					$floor[ $key ] = wp_kses_post( $value );
				}
			}

			return $floor;
		}, wp_unslash( $_POST['woorealestate_property_floor'] ) ) ) : null;
		//phpcs:enable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		$file_name = isset( $_POST['woorealestate_file_attach_name'] ) ? array_values( wc_clean( wp_unslash( $_POST['woorealestate_file_attach_name'] ) ) ) : null;
		$file_url  = isset( $_POST['woorealestate_file_attach_url'] ) ? array_values( array_map( 'sanitize_url', wp_unslash( $_POST['woorealestate_file_attach_url'] ) ) ) : null;

		$woorealestate_file_attachment = $this->array_merge_index( $file_name, $file_url );

		$woorealestate_video_url = isset( $_POST['woorealestate_video_url'] ) ? wc_clean( wp_unslash( $_POST['woorealestate_video_url'] ) ) : null;
		$woorealestate_video_url = $this->handle_url_video( $woorealestate_video_url );


		$woorealestate_property_location = isset( $_POST['woorealestate_property_location'] ) ? wc_clean( wp_unslash( $_POST['woorealestate_property_location'] ) ) : null;

		$woore_meta_data = array(
			'woorealestate_additional_detail' => $woorealestate_additional_detail,
			'woorealestate_property_floor'    => $woorealestate_property_floor,
			'woorealestate_file_attach'       => $woorealestate_file_attachment,
			'woorealestate_property_location' => $woorealestate_property_location,
			'woorealestate_video_image'       => isset( $_POST['woorealestate_video_image'] ) ? wc_clean( wp_unslash( $_POST['woorealestate_video_image'] ) ) : null,
			'woorealestate_video_url'         => sanitize_url( $woorealestate_video_url ),
			'woorealestate_video_local_id'    => isset( $_POST['woorealestate_video_local_id'] ) ? wc_clean( wp_unslash( $_POST['woorealestate_video_local_id'] ) ) : null,
			'woorealestate_video_type'        => isset( $_POST['woorealestate_video_type'] ) ? wc_clean( wp_unslash( $_POST['woorealestate_video_type'] ) ) : null,
		);

		foreach ( $woore_meta_data as $woore_key => $woore_value ) {
			$product->update_meta_data( $woore_key, $woore_value );
		}


		if ( is_wp_error( $errors ) ) {
			\WC_Admin_Meta_Boxes::add_error( $errors->get_error_message() );
		}

	}

	function array_merge_index( $file_name, $file_url ) {
		$new_array = array();

		if ( isset( $file_name ) && isset( $file_url ) ) {
			$array_length = count( $file_url );
			for ( $i = 0; $i < $array_length; $i ++ ) {
				if ( ! empty( $file_url[ $i ] ) ) {

					if ( empty( $file_name[ $i ] ) ) {
						$file_info      = pathinfo( $file_url[ $i ] );
						$name           = basename( $file_url[ $i ] );
						$file_extension = $file_info['extension'];

						if ( empty( $file_extension ) ) {
							$name = $file_url[ $i ];
						}

						$file_name[ $i ] = $name;
					}

					$new_array[] = array( $file_name[ $i ], $file_url[ $i ] );
				}
			}
		}

		return $new_array;
	}

	function handle_url_video( $woorealestate_video_url ) {

		if ( empty( $woorealestate_video_url ) ) {
			return '';
		}

		$yt_pattern    = '#^https?://(?:www\.)?(?:youtube\.com/watch|youtu\.be/)#';
		$vimeo_pattern = '#^https?://(.+\.)?vimeo\.com/.*#';
		$is_vimeo      = ( preg_match( $vimeo_pattern, $woorealestate_video_url ) );
		$is_youtube    = ( preg_match( $yt_pattern, $woorealestate_video_url ) );

		if ( $is_vimeo ) {
			$tmp_array = explode( '/', $woorealestate_video_url );
			// https://developer.vimeo.com/player/sdk/basics
			// https://developer.vimeo.com/guidelines/terms
			$woorealestate_video_url = 'https://player.vimeo.com/video/' . end( $tmp_array );
		}

		if ( $is_youtube ) {
			$pattern = '/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/';
			preg_match( $pattern, $woorealestate_video_url, $matches );
			// https://developers.google.com/youtube/iframe_api_reference
			// https://developers.google.com/youtube/terms/api-services-terms-of-service
			$woorealestate_video_url = 'https://www.youtube.com/embed/' . $matches[1] ?? null;
		}

		return $woorealestate_video_url;
	}

	function save_virtual_tour() {

		if ( isset( $_POST['nonce'], $_POST['post_id'], $_POST['data'] ) && wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'woorealestate_nonce' ) ) {
			$post_id = sanitize_text_field( wp_unslash( $_POST['post_id'] ) );
			$data    = sanitize_text_field( wp_unslash( $_POST['data'] ) );
			$data    = json_decode( $data, true );

			update_post_meta( $post_id, 'woore_tour_settings', $data['default'] );
			update_post_meta( $post_id, 'woore_tour_data', $data );

			wp_send_json_success( "Save data success" );
		}
		wp_die();
	}

	function get_virtual_tour() {

		if ( isset( $_POST['post_id'], $_POST['nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['nonce'] ), 'woorealestate_nonce' ) ) {
			$post_id = sanitize_text_field( wp_unslash( $_POST['post_id'] ) );

			if ( ! current_user_can( 'edit_post', $post_id ) ) {
				return;
			}

			$data      = get_post_meta( $post_id, 'woore_tour_data', true );
			$json_data = wp_json_encode( $data );
			wp_send_json( $json_data );
		} else {
			wp_send_json_error( "Get data failure" );
		}
		wp_die();
	}


}