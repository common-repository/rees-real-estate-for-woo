<?php

namespace REES\Inc;

defined( 'ABSPATH' ) || exit;
class Enqueue {
	protected static $instance = null;
	protected static $setting;
	protected $slug;
	protected $suffix = WP_DEBUG ? '' : '.min';
	protected $lib_styles = [
		'button',
		'tab',
		'input',
		'segment',
		'image',
		'modal',
		'dimmer',
		'transition',
		'menu',
		'grid',
		'search',
		'message',
		'loader',
		'label',
		'select2',
		'header',
		'accordion',
		'dropdown',
		'checkbox',
		'form',
		'table',
		'slider',
		'pannellum',
	];

	protected $lib_scripts = [ 'tab', 'form', 'checkbox', 'slider', 'address-1.6', 'dropdown', 'transition' ];


	private function __construct() {
		$this->slug    = REES_CONST_F['assets_slug'];
		self::$setting = Data::get_instance( true );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_client_scripts' ) );
	}

	public static function instance() {
		return null === self::$instance ? self::$instance = new self() : self::$instance;
	}

	function register_common_scripts() {

		//*************************************//
		$lib_styles = $this->lib_styles;

		foreach ( $lib_styles as $style ) {
			wp_register_style( $this->slug . $style, REES_CONST_F['libs_url'] . $style . '.min.css', '', REES_CONST_F['version'] );
		}

		//*************************************//
		$lib_scripts = $this->lib_scripts;

		foreach ( $lib_scripts as $script ) {
			wp_register_script( $this->slug . $script, REES_CONST_F['libs_url'] . $script . '.min.js', [ 'jquery' ], REES_CONST_F['version'], false );
		}

		// Register google map api
		$map_api_key    = ! empty( self::$setting->get_params( 'google_map_api_key' ) ) ? self::$setting->get_params( 'google_map_api_key' ) : 'AIzaSyAwey_47Cen4qJOjwHQ_sK1igwKPd74J18';
		$google_map_url = 'https://maps.googleapis.com/maps/api/js?libraries=places&language=' . get_locale() . '&key=' . esc_html( $map_api_key );


		wp_register_script( 'google_map', esc_url_raw( $google_map_url ), array(), REES_CONST_F['version'], true );
	}

	function register_admin_scripts() {

		//*************************************//
		$admin_styles = [ 'admin-product-style', 'admin-vicre-setting', 'custom-media', 'custom-pannellum', 'woore-icon', 'icon' ];

		foreach ( $admin_styles as $style ) {
			wp_register_style( $this->slug . $style, REES_CONST_F['css_url'] . $style . $this->suffix . '.css', '', REES_CONST_F['version'] );
		}

		//*************************************//
		$admin_scripts = [
			'admin-product-page'  => [ 'jquery', 'jquery-ui-sortable' ],
			'admin-map'           => [ 'jquery', 'google_map', 'jquery-ui-autocomplete' ],
			'custom-media'        => [ 'jquery' ],
			'admin-vicre-setting' => [ 'jquery', 'jquery-ui-sortable' ],
			'pannellum'           => [],
		];

		foreach ( $admin_scripts as $script => $depend ) {
			wp_register_script( $this->slug . $script, REES_CONST_F['js_url'] . $script . $this->suffix . '.js', $depend, REES_CONST_F['version'], true );
		}
	}

	function enqueue_admin_scripts() {
		$screen_id = get_current_screen()->id;


		$this->register_common_scripts();
		$this->register_admin_scripts();

		$enqueue_scripts = $enqueue_styles = [];

		switch ( $screen_id ) {
			case 'edit-product':
				wp_register_style( 'woore-dummy-handle', false, array(), REES_CONST_F['version'], false );
				wp_enqueue_style( 'woore-dummy-handle' );
				wp_add_inline_style( 'woore-dummy-handle', '.column-taxonomy-woore-feature{width: 14%;} .woore-top-subinfo{display: none !important;}' );
				break;
			case 'product':
				wp_enqueue_editor();
				$enqueue_styles  = [
					'admin-product-style',
					'input',
					'custom-media',
					'pannellum',
					'custom-pannellum',
					'select2'
				];
				$enqueue_scripts = [ 'admin-product-page', 'admin-map', 'custom-media', 'pannellum', 'select2' ];
				break;
			case 'toplevel_page_vic-real-estate-setting':
				wp_enqueue_media();
				$enqueue_styles  = [
					'admin-vicre-setting',
					'icon',
					'input',
					'menu',
					'tab',
					'form',
					'table',
					'button',
					'checkbox',
					'slider',
					'segment',
					'custom-media',
					'dropdown',
					'transition',
					'label'
				];
				$enqueue_scripts = [
					'admin-vicre-setting',
					'tab',
					'form',
					'checkbox',
					'slider',
					'custom-media',
					'address-1.6',
					'dropdown',
					'transition'
				];
				break;

		}


		foreach ( $enqueue_styles as $style ) {
			wp_enqueue_style( $this->slug . $style );
		}


		foreach ( $enqueue_scripts as $script ) {
			wp_enqueue_script( $this->slug . $script );
		}

		$map_params = array(
			'googleMapStyle' => wp_unslash( self::$setting->get_params( 'google_map_style' ) ?? '' ),
			'googleMapZoom'  => self::$setting->get_params( 'map_zoom' ) ?? '',
			'nameCountry'    => $this->get_country(),
		);

		wp_localize_script( $this->slug . 'admin-map', 'VicWreMapParams', $map_params );

		$params = array(
			'i18n'         => I18n::init(),
			'googleMapAPI' => self::$setting->get_params( 'google_map_api_key' ),
			'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
			'nonce'        => wp_create_nonce( 'woorealestate_nonce' ),
		);
		wp_localize_script( $this->slug . 'admin-product-page', 'VicWreParams', $params );

		wp_localize_script( $this->slug . 'admin-vicre-setting', 'VicWreSettingParams', $params );

	}

	function register_client_scripts() {

		wp_register_script( 'vimeo_js', esc_url_raw( 'https://player.vimeo.com/api/player.js' ), array(), REES_CONST_F['version'], true );

		//*************************************//
		$client_styles = [ 'client-style', 'custom-pannellum', 'woore-icon' ];

		foreach ( $client_styles as $style ) {
			wp_register_style( $this->slug . $style, REES_CONST_F['css_url'] . $style . $this->suffix . '.css', '', REES_CONST_F['version'] );
		}

		//*************************************//
		$scripts = [
			'client-single-product' => [ 'jquery', 'google_map', 'vimeo_js' ],
			'pannellum'             => []
		];

		foreach ( $scripts as $script => $depend ) {
			wp_register_script( $this->slug . $script, REES_CONST_F['js_url'] . $script . $this->suffix . '.js', $depend, REES_CONST_F['version'], true );
		}

	}

	function enqueue_client_scripts() {
		global $post;

		$this->register_common_scripts();
		$this->register_client_scripts();

		$enqueue_styles  = [ 'client-style', 'woore-icon', 'pannellum', 'custom-pannellum' ];
		$enqueue_scripts = [ 'client-single-product', 'pannellum' ];
		$localize_script = 'client-single-product';

		if ( is_product() ) {

			$params = array(
				'ajaxUrl'           => admin_url( 'admin-ajax.php' ),
				'nonce'             => wp_create_nonce( 'woorealestate_nonce' ),
				'post_id'           => $post->ID,
				'googleMapStyle'    => wp_unslash( self::$setting->get_params( 'google_map_style' ) ),
				'googleMapZoom'     => self::$setting->get_params( 'map_zoom' ),
				'mapMarkerIcon'     => wp_get_attachment_url( self::$setting->get_params( 'map_marker_icon' ) ) ? wp_get_attachment_url( self::$setting->get_params( 'map_marker_icon' ) ) : self::$setting->get_params( 'map_marker_icon' ),
				'mapUnitSystem'     => self::$setting->get_params( 'map_unit_system' ),
				'country'           => get_post_meta( $post->ID, '_woorealestate_country', true ),
				'rankBy'            => self::$setting->get_params( 'rank_by' ),
				'nearbyPlacesUnit'  => self::$setting->get_params( 'unit_distance' ),
				'nearbyPlacesTypes' => self::$setting->get_params( 'nearby_places_field' ),
				'i18n'              => I18n::init(),
			);

			$enable_captcha = self::$setting->get_params( 'enable_google_recaptcha' );
			$params['enableCaptcha'] = $enable_captcha;
			if ( $enable_captcha ) {
				$captcha_site_key = self::$setting->get_params( 'site_key' );
				if ( $captcha_site_key ) {
					$recaptcha_version = self::$setting->get_params( 'recaptcha_version' );
					$params['captchaSiteKey'] = $captcha_site_key;
					$params['recaptchaVersion'] = $recaptcha_version;
					$params['recaptchaSecretTheme'] = self::$setting->get_params( 'recaptcha_secret_theme' );

					if ( 2 == $recaptcha_version ) {
						$recaptcha_src = esc_url_raw( add_query_arg( array(
							'hl'     => get_locale(),
							'render' => 'explicit',
							'onload' => 'woore_reCaptchaV2Onload'
						), 'https://www.google.com/recaptcha/api.js' ) );

					}else {
						$locate = get_locale();
						$recaptcha_src = "https://www.google.com/recaptcha/api.js?hl=$locate&render=$captcha_site_key";
					}
					$params['recaptchaSrc'] = $recaptcha_src;
				}
			}

			foreach ( $enqueue_styles as $style ) {
				wp_enqueue_style( $this->slug . $style );
			}

			foreach ( $enqueue_scripts as $script ) {
				wp_enqueue_script( $this->slug . $script );
			}

			wp_localize_script( $this->slug . $localize_script, 'VicWreParams', $params );
		}
	}

	function get_country() {
		$selling_locations = WC()->countries->get_allowed_countries();
		$store_location    = WC()->countries->get_countries()[ WC()->countries->get_base_country() ];

		return count( $selling_locations ) === 1 ? array_values( $selling_locations )[0] : $store_location;
	}


}