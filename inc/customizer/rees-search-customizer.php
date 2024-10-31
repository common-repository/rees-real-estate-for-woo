<?php

namespace REES\Inc\Customizer;

use REES\Inc\Data;

defined( 'ABSPATH' ) || exit;

class REES_Search_Customizer {
	protected $settings;
	protected static $instance = null;

	protected $suffix = WP_DEBUG ? '' : '.min';

	public function __construct() {
		$this->settings = Data::get_instance();
		add_action( 'customize_register', array( $this, 'design_option_customizer' ), 9 );
		add_action( 'wp_enqueue_scripts', array( $this, 'customize_controls_print_styles' ) );
		add_action( 'customize_preview_init', array( $this, 'customize_preview_init' ) );
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'customize_controls_enqueue_scripts' ), 30 );
	}

	public static function instance() {
		return null === self::$instance ? self::$instance = new self() : self::$instance;
	}

	function design_option_customizer( $wp_customize ) {
		$this->add_section_design_general( $wp_customize );
		$this->add_section_design_input_search( $wp_customize );
		$this->add_section_design_button_search( $wp_customize );
		$this->add_section_design_price_search( $wp_customize );
		$this->add_section_design_size_search( $wp_customize );
	}

	function add_section_design_general( $wp_customize ) {

		$wp_customize->add_panel( 'woocommerce_real_estate_search', array(
			'title'       => esc_html__( 'WooCommerce Real Estate Search', 'rees-real-estate-for-woo' ),
			'description' => '',
			'priority'    => 200,
		) );

		$wp_customize->add_section( 'woore_search_customizer_general', array(
			'title'          => esc_html__( 'General Settings', 'rees-real-estate-for-woo' ),
			'priority'       => 10,
			'capability'     => 'manage_options',
			'theme_supports' => '',
			'panel'          => 'woocommerce_real_estate_search',
		) );

		$wp_customize->add_section( 'woore_search_customizer_position_fields', array(
			'title'          => esc_html__( 'Search Fields', 'rees-real-estate-for-woo' ),
			'priority'       => 20,
			'capability'     => 'manage_options',
			'theme_supports' => '',
			'panel'          => 'woocommerce_real_estate_search',
		) );

		$wp_customize->add_setting( 'woorealestate_params[fields]', array(
			'default'           => $this->get_params( 'fields' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Field( $wp_customize, 'woorealestate_params[fields]', array(
			'label'          => esc_html__( 'Form Fields', 'rees-real-estate-for-woo' ),
			'section'        => 'woore_search_customizer_position_fields',
			'fields_default' => $this->settings->get_woore_search_fields_default(),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[fields_size]', array(
			'default'           => $this->get_params( 'fields_size' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[fields_size]', array(
			'label'   => esc_html__( 'Fields Size', 'rees-real-estate-for-woo' ),
			'type'    => 'select',
			'section' => 'woore_search_customizer_general',
			'choices' => array(
				'ex_small' => esc_html__( 'Extra Small', 'rees-real-estate-for-woo' ),
				'small'    => esc_html__( 'Small', 'rees-real-estate-for-woo' ),
				'medium'   => esc_html__( 'Medium', 'rees-real-estate-for-woo' ),
				'large'    => esc_html__( 'Large', 'rees-real-estate-for-woo' ),
				'ex_large' => esc_html__( 'Extra Large', 'rees-real-estate-for-woo' ),
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_size]', array(
			'default'           => $this->get_params( 'input_size' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[input_size]', array(
			'label'           => esc_html__( 'Input Size', 'rees-real-estate-for-woo' ),
			'type'            => 'select',
			'section'         => 'woore_search_customizer_general',
			'choices'         => array(
				'2_8'   => esc_html__( 'Extra Small', 'rees-real-estate-for-woo' ),
				'6_12'  => esc_html__( 'Small', 'rees-real-estate-for-woo' ),
				'10_16' => esc_html__( 'Medium', 'rees-real-estate-for-woo' ),
				'14_20' => esc_html__( 'Large', 'rees-real-estate-for-woo' ),
				'18_24' => esc_html__( 'Extra Large', 'rees-real-estate-for-woo' ),
			),
			'active_callback' => function () {
				return false;
			},
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[button_size]', array(
			'default'           => $this->get_params( 'button_size' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[button_size]', array(
			'label'           => esc_html__( 'Button Size', 'rees-real-estate-for-woo' ),
			'type'            => 'select',
			'section'         => 'woore_search_customizer_general',
			'choices'         => array(
				'2_8'   => esc_html__( 'Extra Small', 'rees-real-estate-for-woo' ),
				'6_12'  => esc_html__( 'Small', 'rees-real-estate-for-woo' ),
				'10_16' => esc_html__( 'Medium', 'rees-real-estate-for-woo' ),
				'14_20' => esc_html__( 'Large', 'rees-real-estate-for-woo' ),
				'18_24' => esc_html__( 'Extra Large', 'rees-real-estate-for-woo' ),
			),
			'active_callback' => function () {
				return false;
			},
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[label_fields]', array(
			'default'           => $this->get_params( 'label_fields' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[label_fields]', array(
			'label'   => esc_html__( 'Labels', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_general',
			'choices' => array(
				'none'  => '',
				'block' => '1'
			),
		) ) );

	}

	function add_section_design_input_search( $wp_customize ) {
		$wp_customize->add_section( 'woore_search_customizer_input_search', array(
			'priority'       => 20,
			'capability'     => 'manage_options',
			'theme_supports' => '',
			'title'          => esc_html__( 'Input Search', 'rees-real-estate-for-woo' ),
		) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_label][default]', array(
			'default'           => $this->get_params( 'input_search_label[default]' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[input_search_label][default]', array(
			'label'   => esc_html__( 'Label', 'rees-real-estate-for-woo' ),
			'type'    => 'text',
			'section' => 'woore_search_customizer_input_search',
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_place_holder][default]', array(
			'default'           => $this->get_params( 'input_search_place_holder[default]' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[input_search_place_holder][default]', array(
			'label'   => esc_html__( 'Placeholder', 'rees-real-estate-for-woo' ),
			'type'    => 'text',
			'section' => 'woore_search_customizer_input_search',
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_col_width_desktop]', array(
			'default'           => $this->get_params( 'input_search_col_width_desktop' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[input_search_col_width_desktop]', array(
			'label'       => esc_html__( 'Column Width Desktop (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_input_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_col_width_tablet]', array(
			'default'           => $this->get_params( 'input_search_col_width_tablet' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[input_search_col_width_tablet]', array(
			'label'       => esc_html__( 'Column Width Tablet (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_input_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_col_width_mobile]', array(
			'default'           => $this->get_params( 'input_search_col_width_mobile' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[input_search_col_width_mobile]', array(
			'label'       => esc_html__( 'Column Width Mobile (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_input_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_hide_on_mobile]', array(
			'default'           => $this->get_params( 'input_search_hide_on_mobile' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[input_search_hide_on_mobile]', array(
			'label'   => esc_html__( 'Hide On Mobile', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_input_search',
			'choices' => array(
				'none'  => '1',
				'block' => ''
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_hide_on_tablet]', array(
			'default'           => $this->get_params( 'input_search_hide_on_tablet' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[input_search_hide_on_tablet]', array(
			'label'   => esc_html__( 'Hide On Tablet', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_input_search',
			'choices' => array(
				'none'  => '1',
				'block' => ''
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[input_search_hide_on_desktop]', array(
			'default'           => $this->get_params( 'input_search_hide_on_desktop' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[input_search_hide_on_desktop]', array(
			'label'   => esc_html__( 'Hide On Desktop', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_input_search',
			'choices' => array(
				'none'  => '1',
				'block' => '',
			),
		) ) );
	}

	function add_section_design_button_search( $wp_customize ) {
		$wp_customize->add_section( 'woore_search_customizer_button_search', array(
			'priority'       => 20,
			'capability'     => 'manage_options',
			'theme_supports' => '',
			'title'          => esc_html__( 'Button', 'rees-real-estate-for-woo' ),
		) );

		$wp_customize->add_setting( 'woorealestate_params[button_search_type]', array(
			'default'           => $this->get_params( 'button_search_type' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[button_search_type]', array(
			'label'   => esc_html__( 'Type', 'rees-real-estate-for-woo' ),
			'type'    => 'select',
			'section' => 'woore_search_customizer_button_search',
			'choices' => array(
				'text'      => esc_html__( 'Text', 'rees-real-estate-for-woo' ),
				'icon'      => esc_html__( 'Icon', 'rees-real-estate-for-woo' ),
				'icon_text' => esc_html__( 'Icon Text', 'rees-real-estate-for-woo' ),
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[button_search_text]', array(
			'default'           => $this->get_params( 'button_search_text' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[button_search_text]', array(
			'label'   => esc_html__( 'Text', 'rees-real-estate-for-woo' ),
			'type'    => 'text',
			'section' => 'woore_search_customizer_button_search',
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[button_search_text_size]', array(
			'default'           => $this->get_params( 'button_search_text_size' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[button_search_text_size]', array(
			'label'       => esc_html__( 'Text size (px)', 'rees-real-estate-for-woo' ),
			'type'        => 'number',
			'section'     => 'woore_search_customizer_button_search',
			'input_attrs' => array(
				'min'  => 0,
				'step' => 1
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[button_search_icon_size]', array(
			'default'           => $this->get_params( 'button_search_icon_size' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[button_search_icon_size]', array(
			'label'       => esc_html__( 'Icon size (px)', 'rees-real-estate-for-woo' ),
			'type'        => 'number',
			'section'     => 'woore_search_customizer_button_search',
			'input_attrs' => array(
				'min'  => 0,
				'step' => 1
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[button_search_color]', array(
			'default'           => $this->get_params( 'button_search_color' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control(
			new \WP_Customize_Color_Control(
				$wp_customize,
				'woorealestate_params[button_search_color]',
				array(
					'label'    => esc_html__( 'Color', 'rees-real-estate-for-woo' ),
					'section'  => 'woore_search_customizer_button_search',
					'settings' => 'woorealestate_params[button_search_color]',
				) )
		);

		$wp_customize->add_setting( 'woorealestate_params[button_search_background]', array(
			'default'           => $this->get_params( 'button_search_background' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control(
			new \WP_Customize_Color_Control(
				$wp_customize,
				'woorealestate_params[button_search_background]',
				array(
					'label'    => esc_html__( 'Background', 'rees-real-estate-for-woo' ),
					'section'  => 'woore_search_customizer_button_search',
					'settings' => 'woorealestate_params[button_search_background]',
				) )
		);

		$wp_customize->add_setting( 'woorealestate_params[button_search_border_width]', array(
			'default'           => $this->get_params( 'button_search_border_width' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[button_search_border_width]', array(
			'label'       => esc_html__( 'Border Width (px)', 'rees-real-estate-for-woo' ),
			'type'        => 'number',
			'section'     => 'woore_search_customizer_button_search',
			'input_attrs' => array(
				'min'  => 0,
				'step' => 1
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[button_search_border_style]', array(
			'default'           => $this->get_params( 'button_search_border_style' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new \WP_Customize_Control( $wp_customize, 'woorealestate_params[button_search_border_style]', array(
			'label'   => esc_html__( 'Border Style', 'rees-real-estate-for-woo' ),
			'type'    => 'select',
			'section' => 'woore_search_customizer_button_search',
			'choices' => array(
				'solid'  => esc_html__( 'Solid', 'rees-real-estate-for-woo' ),
				'dashed' => esc_html__( 'Dashed', 'rees-real-estate-for-woo' ),
				'dotted' => esc_html__( 'Dotted', 'rees-real-estate-for-woo' ),
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[button_search_border_color]', array(
			'default'           => $this->get_params( 'button_search_border_color' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control(
			new \WP_Customize_Color_Control(
				$wp_customize,
				'woorealestate_params[button_search_border_color]',
				array(
					'label'    => esc_html__( 'Border Color', 'rees-real-estate-for-woo' ),
					'section'  => 'woore_search_customizer_button_search',
					'settings' => 'woorealestate_params[button_search_border_color]',
				) )
		);

	}

	function add_section_design_price_search( $wp_customize ) {
		$wp_customize->add_section( 'woore_search_customizer_price_search', array(
			'priority'       => 20,
			'capability'     => 'manage_options',
			'theme_supports' => '',
			'title'          => esc_html__( 'Price', 'rees-real-estate-for-woo' ),
		) );

		$wp_customize->add_setting( 'woorealestate_params[price_search_col_width_desktop]', array(
			'default'           => $this->get_params( 'price_search_col_width_desktop' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[price_search_col_width_desktop]', array(
			'label'       => esc_html__( 'Column Width Desktop (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_price_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[price_search_col_width_tablet]', array(
			'default'           => $this->get_params( 'price_search_col_width_tablet' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[price_search_col_width_tablet]', array(
			'label'       => esc_html__( 'Column Width Tablet (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_price_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[price_search_col_width_mobile]', array(
			'default'           => $this->get_params( 'price_search_col_width_mobile' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[price_search_col_width_mobile]', array(
			'label'       => esc_html__( 'Column Width Mobile (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_price_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );


		$wp_customize->add_setting( 'woorealestate_params[price_search_hide_on_mobile]', array(
			'default'           => $this->get_params( 'price_search_hide_on_mobile' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[price_search_hide_on_mobile]', array(
			'label'   => esc_html__( 'Hide On Mobile', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_price_search',
			'choices' => array(
				'none'  => '1',
				'block' => '',
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[price_search_hide_on_tablet]', array(
			'default'           => $this->get_params( 'price_search_hide_on_tablet' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[price_search_hide_on_tablet]', array(
			'label'   => esc_html__( 'Hide On Tablet', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_price_search',
			'choices' => array(
				'none'  => '1',
				'block' => '',
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[price_search_hide_on_desktop]', array(
			'default'           => $this->get_params( 'price_search_hide_on_desktop' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[price_search_hide_on_desktop]', array(
			'label'   => esc_html__( 'Hide On Desktop', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_price_search',
			'choices' => array(
				'none'  => '1',
				'block' => '',
			),
		) ) );
	}

	function add_section_design_size_search( $wp_customize ) {

		$wp_customize->add_section( 'woore_search_customizer_size_search', array(
			'priority'       => 20,
			'capability'     => 'manage_options',
			'theme_supports' => '',
			'title'          => esc_html__( 'Size', 'rees-real-estate-for-woo' ),
		) );

		$wp_customize->add_setting( 'woorealestate_params[size_search_col_width_desktop]', array(
			'default'           => $this->get_params( 'size_search_col_width_desktop' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[size_search_col_width_desktop]', array(
			'label'       => esc_html__( 'Column Width Desktop (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_size_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[size_search_col_width_tablet]', array(
			'default'           => $this->get_params( 'size_search_col_width_tablet' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[size_search_col_width_tablet]', array(
			'label'       => esc_html__( 'Column Width Tablet (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_size_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[size_search_col_width_mobile]', array(
			'default'           => $this->get_params( 'size_search_col_width_mobile' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Range_Slider( $wp_customize, 'woorealestate_params[size_search_col_width_mobile]', array(
			'label'       => esc_html__( 'Column Width Mobile (%)', 'rees-real-estate-for-woo' ),
			'section'     => 'woore_search_customizer_size_search',
			'input_attrs' => array(
				'min'  => 0,
				'max'  => 100,
				'step' => 1,
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[size_search_hide_on_mobile]', array(
			'default'           => $this->get_params( 'size_search_hide_on_mobile' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[size_search_hide_on_mobile]', array(
			'label'   => esc_html__( 'Hide On Mobile', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_size_search',
			'choices' => array(
				'none'  => '1',
				'block' => '',
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[size_search_hide_on_tablet]', array(
			'default'           => $this->get_params( 'size_search_hide_on_tablet' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[size_search_hide_on_tablet]', array(
			'label'   => esc_html__( 'Hide On Tablet', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_size_search',
			'choices' => array(
				'none'  => '1',
				'block' => '',
			),
		) ) );

		$wp_customize->add_setting( 'woorealestate_params[size_search_hide_on_desktop]', array(
			'default'           => $this->get_params( 'size_search_hide_on_desktop' ),
			'type'              => 'option',
			'capability'        => 'manage_options',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'postMessage',
		) );

		$wp_customize->add_control( new REES_Customizer_Control_Toggle_Checkbox( $wp_customize, 'woorealestate_params[size_search_hide_on_desktop]', array(
			'label'   => esc_html__( 'Hide On Desktop', 'rees-real-estate-for-woo' ),
			'section' => 'woore_search_customizer_size_search',
			'choices' => array(
				'none'  => '1',
				'block' => '',
			),
		) ) );
	}

	function customize_controls_print_styles() {
		if ( ! is_customize_preview() ) {
			return;
		}
		/*General Section*/
		$this->add_preview_style( array( 'input_size' ),
			'.woore-real-estate-search-page .vi-hui-form input[type=text],.woore-real-estate-search-page .vi-hui-form input[type=number],.woore-real-estate-search-page .vi-hui-form select', array( 'padding' ), array( 'px' ) );
		$this->add_preview_style( array( 'button_size' ), '.woore-real-estate-search-page .vi-hui-form .vi-hui-button', array( 'padding' ), array( 'px' ) );
		$this->add_preview_style( array( 'label_fields' ), '.woore-real-estate-search-page .vi-hui-form .vi-hui-field label, .woore-real-estate-search-page .vi-hui-form .woore_form_search_fields label', array( 'display' ), array( '' ) );
		$this->add_preview_style( array( 'select2_size' ), '.woore-real-estate-search-page .select2-container .select2-selection--single', array( 'height' ), array( 'px' ) );
		$this->add_preview_style( array( 'select2_size' ), '.woore-real-estate-search-page .select2-container--default .select2-selection--single .select2-selection__rendered', array( 'line-height' ), array( 'px' ) );
		$this->add_preview_style( array( 'select2_size' ), '.woore-real-estate-search-page .select2-container--default .select2-selection--single .select2-selection__arrow', array( 'height' ), array( 'px' ) );

		/*Input Search Section*/
		$this->add_preview_style(
			array( 'input_search_hide_on_desktop', 'input_search_hide_on_tablet', 'input_search_hide_on_mobile' ),
			'.woore-real-estate-search-page #woore-real-estate-search-input_search',
			array( 'display', 'display', 'display' ),
			array( '', '', '' ),
			array( 'desktop', 'tablet', 'mobile' )
		);

		$this->add_preview_style(
			array( 'input_search_col_width_desktop', 'input_search_col_width_tablet', 'input_search_col_width_mobile' ),
			'.woore-real-estate-search-page #woore-real-estate-search-input_search',
			array( 'width', 'width', 'width' ),
			array( '%', '%', '%' ),
			array( 'desktop', 'tablet', 'mobile' )
		);

		/*Button Search Section*/
		$this->add_preview_style(
			array( 'button_search_text_size' ),
			'.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .woore-real-estate-search-button_search_text',
			array( 'font-size' ),
			array( 'px' )
		);

		$this->add_preview_style(
			array( 'button_search_icon_size' ),
			'.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .dashicons',
			array( 'font-size' ),
			array( 'px' )
		);

		$this->add_preview_style(
			array( 'button_search_color' ),
			'.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .dashicons, .woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .woore-real-estate-search-button_search_text',
			array( 'color' ),
			array( '' )
		);

		$this->add_preview_style(
			array(
				'button_search_background',
				'button_search_border_width',
				'button_search_border_style',
				'button_search_border_color'
			),
			'.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button',
			array( 'background', 'border-width', 'border-style', 'border-color' ),
			array( '', 'px', '', '' )
		);

		/*Price Search*/

		$this->add_preview_style(
			array( 'price_search_hide_on_desktop', 'price_search_hide_on_tablet', 'price_search_hide_on_mobile' ),
			'.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-price_search',
			array( 'display', 'display', 'display' ),
			array( '', '', '' ),
			array( 'desktop', 'tablet', 'mobile' )
		);

		$this->add_preview_style(
			array( 'price_search_col_width_desktop', 'price_search_col_width_tablet', 'price_search_col_width_mobile' ),
			'.woore-real-estate-search-page #woore-real-estate-search-input-price_search',
			array( 'width', 'width', 'width' ),
			array( '%', '%', '%' ),
			array( 'desktop', 'tablet', 'mobile' )
		);

		/*Size Search*/

		$this->add_preview_style(
			array( 'size_search_hide_on_desktop', 'size_search_hide_on_tablet', 'size_search_hide_on_mobile' ),
			'.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-size_search',
			array( 'display', 'display', 'display' ),
			array( '', '', '' ),
			array( 'desktop', 'tablet', 'mobile' )
		);

		$this->add_preview_style(
			array( 'size_search_col_width_desktop', 'size_search_col_width_tablet', 'size_search_col_width_mobile' ),
			'.woore-real-estate-search-page #woore-real-estate-search-input-size_search',
			array( 'width', 'width', 'width' ),
			array( '%', '%', '%' ),
			array( 'desktop', 'tablet', 'mobile' )
		);
	}

	private function add_preview_style( $names, $element, $style, $suffix = array(), $media = array()) {
        if (empty($names) || !is_array($names)){
	        return;
        }
		foreach ( $names as $key => $name ) {
            $id_css = $this->set( 'preview-' ) . str_replace( '_', '-', $name );
            if (!wp_style_is($id_css)){
	            wp_register_style( $id_css, false,'', REES_CONST_F['version'], false );
	            wp_enqueue_style($id_css);
	            $css_param = explode('_', $this->get_params( $name ) );
	            $css_value = '';

	            if ( count( $css_param ) > 1 && is_array( $css_param ) ) {
		            foreach ( $css_param as $css ) {
			            $css_value .= ' ' . $css . $suffix[ $key ];
		            }
	            }else {
		            $css_param = $this->get_params( $name );
		            switch ( $css_param ) {
			            case '':
				            $css_value = 'none';
				            break;
			            case 'auto':
				            $css_value = 'auto';
				            break;
			            default:
				            $css_value = $css_param . $suffix[ $key ];
		            }
	            }
	            $media_start = '';
	            $media_end = empty( $media[ $key ] ) ? '' : '}';
	            if ( isset( $media[ $key ] ) ) {

		            switch ( $media[ $key ] ) {
			            case 'mobile':
				            $media_start = '@media screen and (max-width: 320px) {';
				            break;
			            case 'tablet':
				            $media_start = '@media screen and (min-width: 321px) and (max-width: 720px) {';
				            break;
			            case 'desktop':
				            $media_start = '@media screen and (min-width: 721px) {';
				            break;
			            default:
		            }
	            }
	            $css =  esc_attr( trim( $media_start . $element . '{' . $style[ $key ] . ':' . $css_value . '}' . $media_end ) ) ;
	            wp_add_inline_style( $id_css, $css );
            }
		}
	}

	function customize_preview_init() {
		wp_enqueue_script( 'woore-customize-preview-js', REES_CONST_F['js_url'] . 'customize-preview' .$this->suffix . '.js', array( 'jquery' ), REES_CONST_F['version'], true );
		wp_localize_script( 'woore-customize-preview-js', 'VicWreSearchParams', array(
			'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'woorealestate_nonce' ),
			'language' => 'default',
		) );
	}

	function customize_controls_enqueue_scripts() {
		wp_enqueue_style( 'woore-customize-preview-style', REES_CONST_F['css_url'] . 'customize-preview' . $this->suffix . '.css', array(), REES_CONST_F['version'] );
		wp_enqueue_script( 'woore-customize-preview-script', REES_CONST_F['js_url'] . 'customize-setting' .$this->suffix . '.js', array( 'jquery' ), REES_CONST_F['version'], true );
        wp_localize_script( 'woore-customize-preview-script', 'vicWreCusSettingParam', array(
	        'searchResultUrl' => admin_url( 'customize.php' ) . '?url=' . rawurlencode( get_permalink( $this->settings->get_params( 'search_result_page' ) ) ),
        ) );
	}

	private function get_params( $name = '' ) {
		return $this->settings->get_params( $name );
	}

	private function set( $name ) {
		return woore_set_prefix( 'woore-real-estate-search-', $name );
	}
}