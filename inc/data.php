<?php

namespace REES\Inc;

defined( 'ABSPATH' ) || exit;

class Data {
	private static $prefix;
	private $params;
	private $default;
	protected static $instance = null;

	public function __construct() {
		global $woorealestate_settings;

		if ( ! $woorealestate_settings ) {
			$woorealestate_settings = get_option( 'woorealestate_params', array() );
		}

		$this->default = array(
			'unit_size'                              => 'sqFt',
			'custom_unit_size'                       => '',
			'unit_land_area'                         => 'sqFt',
			'custom_unit_land_area'                  => '',
			'property_components'                    => 'in_des',
			'style_file_attachment'                  => 's1',
			'mortgage_calculator'                    => '',
			'interest_rate'                          => 5.5,
			'repayment_year'                         => 35,
			'order_of_components'                    => array(
				'overview',
				'address',
				'feature',
				'travel_time',
				'video',
				'virtual_tour',
				'nearby_places',
				'floor_plans',
				'mortgage_calculator',
				'file_attachment',
				'contact',
			),
			'admin_contact'                          => 1,
			'google_map_api_key'                     => '',
			'map_zoom'                               => 12,
			'google_map_style'                       => '',
			'enable_travel_time'                     => 'yes',
			'map_marker_icon'                        => '',
			'map_cluster_icon'                       => '',
			'map_unit_system'                        => 'metric',
			'enable_nearby_places'                   => '',
			'rank_by'                                => 'prominence',
			'unit_distance'                          => 'Km',
			'nearby_places_field'                    => array( 'school' ),
			'enable_google_recaptcha'                => '',
			'recaptcha_version'                      => 2,
			'recaptcha_secret_theme'                 => 'light',
			'site_key'                               => '',
			'secret_key'                             => '',
			'search_result_page'                     => '',
			'search_result_limit'                    => 12,
			/*real_estate_search*/
			'fields'                                 => wp_json_encode( array(
				'banner_search'  => array(
					array( 'input_search', 'on' ),
					array( 'price_search', 'on' ),
					array( 'size_search', 'on' ),
					array( 'button_adv_search', 'on' ),
					array( 'button_search', 'on' ),
					array( 'view_mode', 'on' ),
				),
				'advance_search' => array(
					array( 'type_search', 'on' ),
					array( 'bathrooms_search', 'on' ),
					array( 'bedrooms_search', 'on' ),
					array( 'country_search', 'on' ),
					array( 'states_search', 'on' ),
					array( 'cities_search', 'on' ),
					array( 'neighborhoods_search', 'on' ),
					array( 'feature_search', 'on' ),
					array( 'land_area_search', 'on' ),
				)
			) ),
			'input_size'                             => '6_12',
			'button_size'                            => '6_12',
			'select2_size'                           => 36,
			'fields_size'                            => 'small',
			'fields_border_radius'                   => 4,
			'label_fields'                           => 'none',
			'label_fields_color'                     => '#000',
			'form_background'                        => '#fff',
			'fields_align'                           => 'center',
			'label_fields_color_map'                 => '#000',
			'form_background_map'                    => '#fff',
			'fields_align_map'                       => 'center',
			'slider_skin'                            => 'flat',
			'slider_hide_min_max'                    => '',
			'slider_hide_from_to'                    => '',
			/*input_search*/
			'input_search_label'                     => array( 'default' => esc_html__( 'Search', 'rees-real-estate-for-woo' ) ),
			'input_search_place_holder'              => array( 'default' => esc_html__( 'Enter your search...', 'rees-real-estate-for-woo' ) ),
			'input_search_grow'                      => '1',
			'input_search_col_width_desktop'         => 22,
			'input_search_col_width_tablet'          => 50,
			'input_search_col_width_mobile'          => 100,
			'input_search_hide_on_mobile'            => 'block',
			'input_search_hide_on_tablet'            => 'block',
			'input_search_hide_on_desktop'           => 'block',
			/*bathrooms_search*/
			'bathrooms_search_label'                 => array( 'default' => esc_html__( 'Bathrooms', 'rees-real-estate-for-woo' ) ),
			'bathrooms_search_place_holder'          => array( 'default' => esc_html__( 'Bathrooms', 'rees-real-estate-for-woo' ) ),
			'bathrooms_search_col_width_desktop'     => 32,
			'bathrooms_search_col_width_tablet'      => 50,
			'bathrooms_search_col_width_mobile'      => 100,
			'bathrooms_search_hide_on_mobile'        => 'block',
			'bathrooms_search_hide_on_tablet'        => 'block',
			'bathrooms_search_hide_on_desktop'       => 'block',
			'bathrooms_search_select_data'           => '',
			/*bedrooms_search*/
			'bedrooms_search_label'                  => array( 'default' => esc_html__( 'Bedrooms', 'rees-real-estate-for-woo' ) ),
			'bedrooms_search_place_holder'           => array( 'default' => esc_html__( 'Bedrooms', 'rees-real-estate-for-woo' ) ),
			'bedrooms_search_col_width_desktop'      => 32,
			'bedrooms_search_col_width_tablet'       => 50,
			'bedrooms_search_col_width_mobile'       => 100,
			'bedrooms_search_hide_on_mobile'         => 'block',
			'bedrooms_search_hide_on_tablet'         => 'block',
			'bedrooms_search_hide_on_desktop'        => 'block',
			'bedrooms_search_select_data'            => '',
			/*country_search*/
			'country_search_label'                   => array( 'default' => esc_html__( 'Country', 'rees-real-estate-for-woo' ) ),
			'country_search_place_holder'            => array( 'default' => esc_html__( 'Country', 'rees-real-estate-for-woo' ) ),
			'country_search_col_width_desktop'       => 32,
			'country_search_col_width_tablet'        => 50,
			'country_search_col_width_mobile'        => 100,
			'country_search_hide_on_mobile'          => 'block',
			'country_search_hide_on_tablet'          => 'block',
			'country_search_hide_on_desktop'         => 'block',
			/*states_search*/
			'states_search_label'                    => array( 'default' => esc_html__( 'States', 'rees-real-estate-for-woo' ) ),
			'states_search_place_holder'             => array( 'default' => esc_html__( 'States', 'rees-real-estate-for-woo' ) ),
			'states_search_col_width_desktop'        => 32,
			'states_search_col_width_tablet'         => 50,
			'states_search_col_width_mobile'         => 100,
			'states_search_hide_on_mobile'           => 'block',
			'states_search_hide_on_tablet'           => 'block',
			'states_search_hide_on_desktop'          => 'block',
			/*cities_search*/
			'cities_search_label'                    => array( 'default' => esc_html__( 'Cities', 'rees-real-estate-for-woo' ) ),
			'cities_search_place_holder'             => array( 'default' => esc_html__( 'Cities', 'rees-real-estate-for-woo' ) ),
			'cities_search_col_width_desktop'        => 32,
			'cities_search_col_width_tablet'         => 50,
			'cities_search_col_width_mobile'         => 100,
			'cities_search_hide_on_mobile'           => 'block',
			'cities_search_hide_on_tablet'           => 'block',
			'cities_search_hide_on_desktop'          => 'block',
			/*neighborhoods_search*/
			'neighborhoods_search_label'             => array( 'default' => esc_html__( 'Neighborhoods', 'rees-real-estate-for-woo' ) ),
			'neighborhoods_search_place_holder'      => array( 'default' => esc_html__( 'Neighborhoods', 'rees-real-estate-for-woo' ) ),
			'neighborhoods_search_col_width_desktop' => 32,
			'neighborhoods_search_col_width_tablet'  => 50,
			'neighborhoods_search_col_width_mobile'  => 100,
			'neighborhoods_search_hide_on_mobile'    => 'block',
			'neighborhoods_search_hide_on_tablet'    => 'block',
			'neighborhoods_search_hide_on_desktop'   => 'block',
			/*feature_search*/
			'feature_search_label'                   => array( 'default' => esc_html__( 'Feature', 'rees-real-estate-for-woo' ) ),
			'feature_search_place_holder'            => array( 'default' => esc_html__( 'Feature', 'rees-real-estate-for-woo' ) ),
			'feature_search_col_width_desktop'       => 32,
			'feature_search_col_width_tablet'        => 50,
			'feature_search_col_width_mobile'        => 100,
			'feature_search_hide_on_mobile'          => 'block',
			'feature_search_hide_on_tablet'          => 'block',
			'feature_search_hide_on_desktop'         => 'block',
			/*button_search*/
			'button_search_type'                     => 'text',
			'button_search_text'                     => esc_html__( 'Search', 'rees-real-estate-for-woo' ),
			'button_search_icon'                     => '1',
			'button_search_text_size'                => 16,
			'button_search_icon_size'                => 20,
			'button_search_color'                    => '#fff',
			'button_search_background'               => '#0194f3',
			'button_search_color_hover'              => '#fff',
			'button_search_background_hover'         => '#0194f3',
			'button_search_border_width'             => 1,
			'button_search_border_style'             => 'solid',
			'button_search_border_color'             => '#0194f3',
			/*price_search*/
			'price_search_type'                      => 'input',
			'price_search_label'                     => esc_html__( 'Price', 'rees-real-estate-for-woo' ),
			'price_search_place_holder'              => array( 'default' => esc_html__( 'Price', 'rees-real-estate-for-woo' ) ),
			'price_search_col_width_desktop'         => 32,
			'price_search_col_width_tablet'          => 50,
			'price_search_col_width_mobile'          => 100,
			'price_search_hide_on_mobile'            => 'block',
			'price_search_hide_on_tablet'            => 'block',
			'price_search_hide_on_desktop'           => 'block',
			'price_search_slider_min'                => 0,
			'price_search_slider_max'                => 100,
			'price_search_slider_from'               => 20,
			'price_search_slider_to'                 => 80,
			'price_search_slider_step'               => 1,
			'price_search_select_data'               => '',
			/*size_search*/
			'size_search_type'                       => 'input',
			'size_search_label'                      => esc_html__( 'Size', 'rees-real-estate-for-woo' ),
			'size_search_place_holder'               => array( 'default' => esc_html__( 'Size', 'rees-real-estate-for-woo' ) ),
			'size_search_col_width_desktop'          => 32,
			'size_search_col_width_tablet'           => 50,
			'size_search_col_width_mobile'           => 100,
			'size_search_hide_on_mobile'             => 'block',
			'size_search_hide_on_tablet'             => 'block',
			'size_search_hide_on_desktop'            => 'block',
			'size_search_slider_min'                 => 0,
			'size_search_slider_max'                 => 100,
			'size_search_slider_from'                => 20,
			'size_search_slider_to'                  => 80,
			'size_search_slider_step'                => 1,
			'size_search_select_data'                => '',
			/*land_area*/
			'land_area_search_type'                  => 'input',
			'land_area_search_label'                 => esc_html__( 'Land Area', 'rees-real-estate-for-woo' ),
			'land_area_search_place_holder'          => array( 'default' => esc_html__( 'Land Area', 'rees-real-estate-for-woo' ) ),
			'land_area_search_col_width_desktop'     => 32,
			'land_area_search_col_width_tablet'      => 50,
			'land_area_search_col_width_mobile'      => 100,
			'land_area_search_hide_on_mobile'        => 'block',
			'land_area_search_hide_on_tablet'        => 'block',
			'land_area_search_hide_on_desktop'       => 'block',
			'land_area_search_slider_min'            => 0,
			'land_area_search_slider_max'            => 100,
			'land_area_search_slider_from'           => 20,
			'land_area_search_slider_to'             => 80,
			'land_area_search_slider_step'           => 1,
			'land_area_search_select_data'           => '',
			/*type_search*/
			'type_search_label'                      => array( 'default' => esc_html__( 'Type', 'rees-real-estate-for-woo' ) ),
			'type_search_place_holder'               => array( 'default' => esc_html__( 'Type', 'rees-real-estate-for-woo' ) ),
			'type_search_col_width_desktop'          => 32,
			'type_search_col_width_tablet'           => 50,
			'type_search_col_width_mobile'           => 100,
			'type_search_hide_on_mobile'             => 'block',
			'type_search_hide_on_tablet'             => 'block',
			'type_search_hide_on_desktop'            => 'block',
			/*button_adv_search*/
			'button_adv_search_type'                 => 'icon',
			'button_adv_search_text'                 => esc_html__( 'Advance', 'rees-real-estate-for-woo' ),
			'button_adv_search_icon'                 => '7',
			'button_adv_search_text_size'            => 16,
			'button_adv_search_icon_size'            => 13,
			'button_adv_search_color'                => '#0194f3',
			'button_adv_search_background'           => '#fff',
			'button_adv_search_color_hover'          => '#0194f3',
			'button_adv_search_background_hover'     => '#fff',
			'button_adv_search_border_width'         => 1,
			'button_adv_search_border_style'         => 'solid',
			'button_adv_search_border_color'         => '#0194f3',
			'button_adv_search_show_outside'         => '',
			/*view_mode*/
			'view_mode_type'                         => 'icon',
			'view_mode_text_size'                    => 16,
			'view_mode_icon_size'                    => 15,
			'view_mode_color'                        => '#0194f3',
			'view_mode_background'                   => '#fff',
			'view_mode_color_hover'                  => '#0194f3',
			'view_mode_background_hover'             => '#fff',
			'view_mode_border_width'                 => 1,
			'view_mode_border_style'                 => 'solid',
			'view_mode_border_color'                 => '#0194f3',
		);

		$this->params = apply_filters( 'woorealestate_params', wp_parse_args( $woorealestate_settings, $this->default ) );
	}

	public function get_params( $name = "" ) {
		if ( ! $name ) {
			return $this->params;
		} elseif ( isset( $this->params[ $name ] ) ) {
			return apply_filters( 'woorealestate_params_' . $name, $this->params[ $name ] );
		} else {
			return false;
		}
	}

	public static function get_instance( $new = false ) {
		if ( $new || null === self::$instance ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

	function get_data() {
		return array(
			'unit_default'                  => array(
				'sqFt' => esc_html__( 'Square Feet (SqFt)', 'rees-real-estate-for-woo' ),
				'm2'   => esc_html__( 'Meter (m2)', 'rees-real-estate-for-woo' ),
				'cs'   => esc_html__( 'Custom Unit', 'rees-real-estate-for-woo' ),
			),
			'component_product_default'     => array(
				'on'     => esc_html__( 'On product tabs', 'rees-real-estate-for-woo' ),
				'in'     => esc_html__( 'In product tabs', 'rees-real-estate-for-woo' ),
				'in_des' => esc_html__( 'In description tab', 'rees-real-estate-for-woo' ),
			),
			'unit_system_default'           => array(
				'metric'   => esc_html__( 'Kilometer', 'rees-real-estate-for-woo' ),
				'imperial' => esc_html__( 'Mile', 'rees-real-estate-for-woo' ),
			),
			'nearby_places_unit_default'    => array(
				'Km' => esc_html__( 'Kilometer', 'rees-real-estate-for-woo' ),
				'mi' => esc_html__( 'Mile', 'rees-real-estate-for-woo' ),
			),
			'nearby_places_rank_by_default' => array(
				'distance'   => esc_html__( 'Distance', 'rees-real-estate-for-woo' ),
				'prominence' => esc_html__( 'Prominence', 'rees-real-estate-for-woo' ),
			),
			'style_file_attachment_default' => array(
				's1' => esc_html__( 'List style', 'rees-real-estate-for-woo' ),
				's2' => esc_html__( 'Table style', 'rees-real-estate-for-woo' ),
			),
			'order_of_components_default'   => array(
				'overview'            => esc_html__( 'Overview', 'rees-real-estate-for-woo' ),
				'address'             => esc_html__( 'Address', 'rees-real-estate-for-woo' ),
				'feature'             => esc_html__( 'Feature', 'rees-real-estate-for-woo' ),
				'travel_time'         => esc_html__( 'Travel Time', 'rees-real-estate-for-woo' ),
				'video'               => esc_html__( 'Video', 'rees-real-estate-for-woo' ),
				'virtual_tour'        => esc_html__( 'Virtual Tour', 'rees-real-estate-for-woo' ),
				'nearby_places'       => esc_html__( 'Nearby Places', 'rees-real-estate-for-woo' ),
				'floor_plans'         => esc_html__( 'Floor Plans', 'rees-real-estate-for-woo' ),
				'contact'             => esc_html__( 'Contact', 'rees-real-estate-for-woo' ),
				'mortgage_calculator' => esc_html__( 'Mortgage Calculator', 'rees-real-estate-for-woo' ),
				'file_attachment'     => esc_html__( 'File Attachment', 'rees-real-estate-for-woo' ),
			),
		);
	}

	function get_nearby_places_type_default() {
		return array(
			'accounting'             => esc_html__( 'Accounting', 'rees-real-estate-for-woo' ),
			'airport'                => esc_html__( 'Airport', 'rees-real-estate-for-woo' ),
			'amusement_park'         => esc_html__( 'Amusement Park', 'rees-real-estate-for-woo' ),
			'aquarium'               => esc_html__( 'Aquarium', 'rees-real-estate-for-woo' ),
			'atm'                    => esc_html__( 'Atm', 'rees-real-estate-for-woo' ),
			'bakery'                 => esc_html__( 'Bakery', 'rees-real-estate-for-woo' ),
			'bank'                   => esc_html__( 'Bank', 'rees-real-estate-for-woo' ),
			'bar'                    => esc_html__( 'Bar', 'rees-real-estate-for-woo' ),
			'beauty_salon'           => esc_html__( 'Beauty Salon', 'rees-real-estate-for-woo' ),
			'bicycle_store'          => esc_html__( 'Bicycle Store', 'rees-real-estate-for-woo' ),
			'book_store'             => esc_html__( 'Book Store', 'rees-real-estate-for-woo' ),
			'bowling_alley'          => esc_html__( 'Bowling Alley', 'rees-real-estate-for-woo' ),
			'bus_station'            => esc_html__( 'Bus Station', 'rees-real-estate-for-woo' ),
			'cafe'                   => esc_html__( 'Cafe', 'rees-real-estate-for-woo' ),
			'campground'             => esc_html__( 'Campground', 'rees-real-estate-for-woo' ),
			'car_rental'             => esc_html__( 'Car Rental', 'rees-real-estate-for-woo' ),
			'car_repair'             => esc_html__( 'Car Repair', 'rees-real-estate-for-woo' ),
			'car_wash'               => esc_html__( 'Car Wash', 'rees-real-estate-for-woo' ),
			'casino'                 => esc_html__( 'Casino', 'rees-real-estate-for-woo' ),
			'cemetery'               => esc_html__( 'Cemetery', 'rees-real-estate-for-woo' ),
			'church'                 => esc_html__( 'Church', 'rees-real-estate-for-woo' ),
			'city_hall'              => esc_html__( 'City Center', 'rees-real-estate-for-woo' ),
			'clothing_store'         => esc_html__( 'Clothing Store', 'rees-real-estate-for-woo' ),
			'convenience_store'      => esc_html__( 'Convenience Store', 'rees-real-estate-for-woo' ),
			'courthouse'             => esc_html__( 'Courthouse', 'rees-real-estate-for-woo' ),
			'dentist'                => esc_html__( 'Dentist', 'rees-real-estate-for-woo' ),
			'department_store'       => esc_html__( 'Department Store', 'rees-real-estate-for-woo' ),
			'doctor'                 => esc_html__( 'Doctor', 'rees-real-estate-for-woo' ),
			'electrician'            => esc_html__( 'Electrician', 'rees-real-estate-for-woo' ),
			'electronics_store'      => esc_html__( 'Electronics Store', 'rees-real-estate-for-woo' ),
			'embassy'                => esc_html__( 'Embassy', 'rees-real-estate-for-woo' ),
			'establishment'          => esc_html__( 'Establishment', 'rees-real-estate-for-woo' ),
			'finance'                => esc_html__( 'Finance', 'rees-real-estate-for-woo' ),
			'fire_station'           => esc_html__( 'Fire Station', 'rees-real-estate-for-woo' ),
			'florist'                => esc_html__( 'Florist', 'rees-real-estate-for-woo' ),
			'food'                   => esc_html__( 'Food', 'rees-real-estate-for-woo' ),
			'gas_station'            => esc_html__( 'Gas Station', 'rees-real-estate-for-woo' ),
			"grocery_or_supermarket" => esc_html__( 'Grocery', 'rees-real-estate-for-woo' ),
			'gym'                    => esc_html__( 'Gym', 'rees-real-estate-for-woo' ),
			"hair_care"              => esc_html__( 'Hair Care', 'rees-real-estate-for-woo' ),
			'hardware_store'         => esc_html__( 'HardwareStore', 'rees-real-estate-for-woo' ),
			'health'                 => esc_html__( 'Health', 'rees-real-estate-for-woo' ),
			'home_goods_store'       => esc_html__( 'Home Goods Store', 'rees-real-estate-for-woo' ),
			'hospital'               => esc_html__( 'Hospital', 'rees-real-estate-for-woo' ),
			'jewelry_store'          => esc_html__( 'Jewelry Store', 'rees-real-estate-for-woo' ),
			'laundry'                => esc_html__( 'Laundry', 'rees-real-estate-for-woo' ),
			'lawyer'                 => esc_html__( 'Lawyer', 'rees-real-estate-for-woo' ),
			'library'                => esc_html__( 'Library', 'rees-real-estate-for-woo' ),
			'lodging'                => esc_html__( 'Lodging', 'rees-real-estate-for-woo' ),
			'movie_theater'          => esc_html__( 'Movie Theater', 'rees-real-estate-for-woo' ),
			'moving_company'         => esc_html__( 'Moving Company', 'rees-real-estate-for-woo' ),
			'night_club'             => esc_html__( 'Night Club', 'rees-real-estate-for-woo' ),
			'park'                   => esc_html__( 'Park', 'rees-real-estate-for-woo' ),
			'pharmacy'               => esc_html__( 'Pharmacy', 'rees-real-estate-for-woo' ),
			'place_of_worship'       => esc_html__( 'Place Of Worship', 'rees-real-estate-for-woo' ),
			'plumber'                => esc_html__( 'Plumber', 'rees-real-estate-for-woo' ),
			'police'                 => esc_html__( 'Police', 'rees-real-estate-for-woo' ),
			'post_office'            => esc_html__( 'Post Office', 'rees-real-estate-for-woo' ),
			'restaurant'             => esc_html__( 'Restaurant', 'rees-real-estate-for-woo' ),
			'school'                 => esc_html__( 'School', 'rees-real-estate-for-woo' ),
			'shopping_mall'          => esc_html__( 'Shopping Mall', 'rees-real-estate-for-woo' ),
			'spa'                    => esc_html__( 'Spa', 'rees-real-estate-for-woo' ),
			'stadium'                => esc_html__( 'Stadium', 'rees-real-estate-for-woo' ),
			'storage'                => esc_html__( 'Storage', 'rees-real-estate-for-woo' ),
			'store'                  => esc_html__( 'Store', 'rees-real-estate-for-woo' ),
			'subway_station'         => esc_html__( 'Subway Station', 'rees-real-estate-for-woo' ),
			'synagogue'              => esc_html__( 'Synagogue', 'rees-real-estate-for-woo' ),
			'taxi_stand'             => esc_html__( 'Taxi Stand', 'rees-real-estate-for-woo' ),
			'train_station'          => esc_html__( 'Train Station', 'rees-real-estate-for-woo' ),
			'travel_agency'          => esc_html__( 'Travel Agency', 'rees-real-estate-for-woo' ),
			'university'             => esc_html__( 'University', 'rees-real-estate-for-woo' ),
			'veterinary_care'        => esc_html__( 'Veterinary Care', 'rees-real-estate-for-woo' ),
			'zoo'                    => esc_html__( 'Zoo', 'rees-real-estate-for-woo' ),
		);
	}

	function get_woore_search_fields_default() {
		return array(
			'input_search'  => esc_html__( 'Search', 'rees-real-estate-for-woo' ),
			'price_search'  => esc_html__( 'Price', 'rees-real-estate-for-woo' ),
			'size_search'   => esc_html__( 'Size', 'rees-real-estate-for-woo' ),
			'button_search' => esc_html__( 'Search Button', 'rees-real-estate-for-woo' ),
		);
	}

}