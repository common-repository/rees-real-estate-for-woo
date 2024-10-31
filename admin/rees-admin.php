<?php

namespace REES\Admin;

use REES\Inc\Data;

defined( 'ABSPATH' ) || exit;

class REES_Admin {

	protected static $instance = null;
	protected static $setting;

	private function __construct() {
		self::$setting = Data::get_instance();
		add_action( 'admin_menu', array( $this, 'add_real_estate_menu' ) );
		add_action( 'admin_init', array( $this, 'save_settings' ) );
	}

	public static function instance() {
		return null === self::$instance ? self::$instance = new self() : self::$instance;
	}

	function add_real_estate_menu() {
		$hookname = add_menu_page(
			esc_html__( 'REES', 'rees-real-estate-for-woo' ),
			esc_html__( 'REES', 'rees-real-estate-for-woo' ),
			'manage_options',
			'vic-real-estate-setting',
			null,
			'dashicons-building',
			2
		);

		add_submenu_page(
			'vic-real-estate-setting',
			esc_html__( 'Settings', 'rees-real-estate-for-woo' ),
			esc_html__( 'Settings', 'rees-real-estate-for-woo' ),
			'manage_options',
			'vic-real-estate-setting',
			array( $this, 'page_callback' )
		);
	}

	function page_callback() {
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract
		extract( self::$setting->get_params() );
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract
		extract( self::$setting->get_data() );
		$nearby_places_type_default = self::$setting->get_nearby_places_type_default();
		include_once( REES_CONST_F['plugin_dir'] . 'admin/rees-setting.php' );
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'villatheme_support_rees-real-estate-for-woo' );
	}

	function save_settings() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( ! isset( $_POST['_rees_setting_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_rees_setting_nonce'] ) ), 'wrealestate_nonce' ) ) {
			return;
		}

		global $woorealestate_settings;

		$unit_size               = isset( $_POST['rees_unit_size'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_unit_size'] ) ) : '';
		$custom_unit_size        = isset( $_POST['rees_custom_unit_size'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_custom_unit_size'] ) ) : '';
		$unit_land_area          = isset( $_POST['rees_unit_land_area'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_unit_land_area'] ) ) : '';
		$custom_unit_land_area   = isset( $_POST['rees_custom_unit_land_area'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_custom_unit_land_area'] ) ) : '';
		$style_file_attachment   = isset( $_POST['rees_style_file_attachment'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_style_file_attachment'] ) ) : '';
		$property_components     = isset( $_POST['rees_property_components'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_property_components'] ) ) : '';
		$order_of_components     = isset( $_POST['rees_order_of_components'] ) ? wc_clean( wp_unslash( $_POST['rees_order_of_components'] ) ) : '';
		$admin_contact           = isset( $_POST['rees_admin_contact'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_admin_contact'] ) ) : '';
		$google_map_api_key      = isset( $_POST['rees_google_map_api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_google_map_api_key'] ) ) : '';
		$map_zoom                = isset( $_POST['rees_map_zoom'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_map_zoom'] ) ) : '';
		$google_map_style        = isset( $_POST['rees_google_map_style'] ) ? sanitize_textarea_field( wp_unslash( $_POST['rees_google_map_style'] ) ) : '';
		$map_marker_icon         = isset( $_POST['rees_map_marker_icon'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_map_marker_icon'] ) ) : '';
		$enable_travel_time      = isset( $_POST['rees_enable_travel_time'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_enable_travel_time'] ) ) : '';
		$map_unit_system         = isset( $_POST['rees_map_unit_system'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_map_unit_system'] ) ) : '';
		$enable_nearby_places    = isset( $_POST['rees_enable_nearby_places'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_enable_nearby_places'] ) ) : '';
		$rank_by                 = isset( $_POST['rees_rank_by'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_rank_by'] ) ) : '';
		$unit_distance           = isset( $_POST['rees_unit_distance'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_unit_distance'] ) ) : '';
		$nearby_places_field     = isset( $_POST['rees_nearby_places_field'] ) ? wc_clean( wp_unslash( $_POST['rees_nearby_places_field'] ) ) : '';
		$mortgage_calculator     = isset( $_POST['rees_mortgage_calculator'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_mortgage_calculator'] ) ) : '';
		$interest_rate           = isset( $_POST['rees_interest_rate'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_interest_rate'] ) ) : '';
		$repayment_year          = isset( $_POST['rees_repayment_year'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_repayment_year'] ) ) : '';
		$enable_google_recaptcha = isset( $_POST['rees_enable_google_recaptcha'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_enable_google_recaptcha'] ) ) : '';
		$recaptcha_version       = isset( $_POST['rees_recaptcha_version'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_recaptcha_version'] ) ) : '';
		$site_key                = isset( $_POST['rees_site_key'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_site_key'] ) ) : '';
		$secret_key              = isset( $_POST['rees_secret_key'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_secret_key'] ) ) : '';
		$recaptcha_secret_theme  = isset( $_POST['rees_recaptcha_secret_theme'] ) ? sanitize_text_field( wp_unslash( $_POST['rees_recaptcha_secret_theme'] ) ) : '';
		$search_result_page      = isset( $_POST['rees_search_result_page'] ) ? sanitize_textarea_field( wp_unslash( $_POST['rees_search_result_page'] ) ) : '';

		$data_r = array(
			'unit_size'               => $unit_size,
			'custom_unit_size'        => $custom_unit_size,
			'unit_land_area'          => $unit_land_area,
			'custom_unit_land_area'   => $custom_unit_land_area,
			'style_file_attachment'   => $style_file_attachment,
			'property_components'     => $property_components,
			'order_of_components'     => $order_of_components,
			'admin_contact'           => $admin_contact,
			'google_map_api_key'      => $google_map_api_key,
			'map_zoom'                => $map_zoom,
			'google_map_style'        => $google_map_style,
			'map_marker_icon'         => $map_marker_icon,
			'enable_travel_time'      => $enable_travel_time,
			'map_unit_system'         => $map_unit_system,
			'enable_nearby_places'    => $enable_nearby_places,
			'rank_by'                 => $rank_by,
			'unit_distance'           => $unit_distance,
			'nearby_places_field'     => $nearby_places_field,
			'mortgage_calculator'     => $mortgage_calculator,
			'interest_rate'           => $interest_rate,
			'repayment_year'          => $repayment_year,
			'enable_google_recaptcha' => $enable_google_recaptcha,
			'recaptcha_version'       => $recaptcha_version,
			'site_key'                => $site_key,
			'secret_key'              => $secret_key,
			'recaptcha_secret_theme'  => $recaptcha_secret_theme,
			'search_result_page'      => $search_result_page,
		);

		$data_r = wp_parse_args( $data_r, self::$setting->get_params() );
		update_option( 'woorealestate_params', $data_r );
		$woorealestate_settings = $data_r;
		self::$setting          = Data::get_instance( true );
	}

}