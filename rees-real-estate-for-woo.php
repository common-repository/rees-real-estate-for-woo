<?php
/**
 * Plugin Name: REES - Real Estate for Woo
 * Plugin URI: https://villatheme.com/extensions/rees-real-estate-for-woo/
 * Description: Build stunning real estate websites with REES - Real Estate for WooCommerce. Property templates, Google Maps, virtual tours & more!
 * Version: 1.0.2
 * Author: VillaTheme
 * Author URI: https://villatheme.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: rees-real-estate-for-woo
 * Domain Path: /languages
 * Copyright 2024 VillaTheme.com. All rights reserved.
 * Requires Plugins: woocommerce
 * Requires PHP: 7.0
 * Requires at least: 5.0
 * Tested up to: 6.6.2
 * WC requires at least: 7.0
 * WC tested up to: 9.3.1
 */


namespace REES;

use REES\Admin\REES_Admin;
use REES\Inc\Data;
use REES\Inc\Enqueue;
use REES\Inc\REES_Builder;
use REES\Inc\REES_Content;
use REES\Inc\REES_Admin_Profile;
use REES\Inc\Customizer\REES_Search_Customizer;
use REES\Inc\Frontend\REES_Search_Frontend;

defined( 'ABSPATH' ) || exit;

include_once( ABSPATH . 'wp-admin/includes/plugin.php' );


//Compatible with High-Performance order storage (COT)
add_action( 'before_woocommerce_init', function () {
	if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
	}
} );

if ( is_plugin_active( 'rees-real-estate-for-woocommerce/rees-real-estate-for-woocommerce.php' ) ) {
	return;
}

require_once plugin_dir_path( __FILE__ ) . 'autoload.php';

if ( ! class_exists( 'VillaTheme_Require_Environment' ) ) {
	require_once plugin_dir_path( __FILE__ ) . 'support/support.php';
}

if ( ! class_exists( 'Woo_Real_Estate' ) ) {
	class Woo_Real_Estate {

		public function __construct() {
			$this->define();

			add_action( 'plugins_loaded', [ $this, 'plugins_loaded' ] );
			register_activation_hook( __FILE__, array( $this, 'install' ) );
		}

		public function define() {
			define( 'REES_CONST_F', [
				'version'     => '1.0.2',
				'plugin_name' => 'REES - Real Estate for Woo',
				'slug'        => 'woore',
				'assets_slug' => 'woore-',
				'file'        => __FILE__,
				'basename'    => plugin_basename( __FILE__ ),
				'plugin_dir'  => plugin_dir_path( __FILE__ ),
				'libs_url'    => plugins_url( 'assets/libs/', __FILE__ ),
				'css_url'     => plugins_url( 'assets/css/', __FILE__ ),
				'js_url'      => plugins_url( 'assets/js/', __FILE__ ),
				'img_url'     => plugins_url( 'assets/img/', __FILE__ ),
			] );
		}

		public function plugins_loaded() {
			$environment = new \VillaTheme_Require_Environment( [
					'plugin_name'     => 'REES - Real Estate for Woo',
					'php_version'     => '7.0',
					'wp_version'      => '5.0',
					'wc_version'      => '7.0',
					'require_plugins' => [
						[
							'slug' => 'woocommerce',
							'name' => 'WooCommerce',
						],
					],
				]
			);

			if ( $environment->has_error() ) {
				return;
			}

			$this->init();
		}

		public function init() {
			add_filter( 'plugin_action_links_' . REES_CONST_F['basename'], [ $this, 'setting_link' ] );
			$this->load_text_domain();
			$this->load_classes();
		}

		public function load_text_domain() {
			load_plugin_textdomain( 'rees-real-estate-for-woo', false, REES_CONST_F['basename'] . '/languages' );
		}

		public function install() {
			$check_active = get_option( 'woorealestate_params' );
			if ( ! $check_active ) {
				$settings                   = Data::get_instance();
				$params                     = $settings->get_params();
				$params['map_marker_icon']  = REES_CONST_F['img_url'] . 'map-marker-icon.png';
				$params['map_cluster_icon'] = REES_CONST_F['img_url'] . 'map-cluster-icon.png';

				$page = array(
					'post_title'  => esc_html__( 'Search Result', 'rees-real-estate-for-woo' ),
					'post_status' => 'publish',
					'post_type'   => 'page',
					'post_name'   => 'search-result',
				);
				if ( ! $params['search_result_page'] ) {
					$page_id = wp_insert_post( $page, true );
					if ( ! is_wp_error( $page_id ) ) {
						$params['search_result_page'] = $page_id;
					}
				}

				update_option( 'woorealestate_params', $params );
			}
		}

		function load_classes() {
			require_once REES_CONST_F['plugin_dir'] . 'inc/functions.php';

			REES_Admin_Profile::instance();
			Enqueue::instance();
			REES_Admin::instance();
			REES_Builder::instance();
			REES_Content::instance();
			REES_Search_Customizer::instance();
			REES_Search_Frontend::instance();


			if ( is_admin() && ! wp_doing_ajax() ) {
				$this->support();
			}

		}

		public function support() {
			new \VillaTheme_Support(
				array(
					'support'    => 'https://villatheme.com/supports/forum/presale/',
					'docs'       => 'https://docs.villatheme.com/rees-real-estate-for-woocommerce',
					'review'     => 'https://wordpress.org/support/plugin/rees-real-estate-for-woo/reviews/?rate=5#rate-response',
					'pro_url'    => '',
					'css'        => REES_CONST_F['css_url'],
					'image'      => REES_CONST_F['img_url'],
					'slug'       => 'rees-real-estate-for-woo',
					'menu_slug'  => 'vic-real-estate-setting',
					'version'    => REES_CONST_F['version'],
					'survey_url' => ''
				)
			);
		}

		public function setting_link( $links ) {
			return array_merge(
				[
					sprintf( "<a href='%1s' >%2s</a>", esc_url( admin_url( 'admin.php?page=vic-real-estate-setting' ) ),
						esc_html__( 'Settings', 'rees-real-estate-for-woo' ) )
				],
				$links );
		}
	}

	new Woo_Real_Estate();

}