<?php

namespace REES\Inc;

defined( 'ABSPATH' ) || exit;

class I18n {
	public static function init() {
		return array(
			'floor'                => esc_html__( 'Floor', 'rees-real-estate-for-woo' ),
			'floor_plan_image'     => esc_html__( 'Floor Plan Image', 'rees-real-estate-for-woo' ),
			'floor_name'           => esc_html__( 'Floor Name', 'rees-real-estate-for-woo' ),
			'floor_size'           => esc_html__( 'Floor Size', 'rees-real-estate-for-woo' ),
			'additional_details'   => esc_html__( 'Additional Details', 'rees-real-estate-for-woo' ),
			'example_name'         => esc_attr__( 'Example value: Ground Floor', 'rees-real-estate-for-woo' ),
			'example_size'         => esc_attr__( 'Example value: 2000.', 'rees-real-estate-for-woo' ),
			'not_found'            => esc_html__( 'Not Found', 'rees-real-estate-for-woo' ),
			'per_month'            => esc_html__( 'per month', 'rees-real-estate-for-woo' ),
			'choose_video'         => esc_html__( 'Choose Video', 'rees-real-estate-for-woo' ),
			'choose_image'         => esc_html__( 'Choose Image', 'rees-real-estate-for-woo' ),
			'select'               => esc_html__( 'Select', 'rees-real-estate-for-woo' ),
			'set_default'          => esc_html__( 'Set as Default:', 'rees-real-estate-for-woo' ),
			'success'              => esc_html__( 'Success', 'rees-real-estate-for-woo' ),
			'saved'                => esc_html__( 'The changes has been saved', 'rees-real-estate-for-woo' ),
			'error'                => esc_html__( 'Error', 'rees-real-estate-for-woo' ),
			'scene_to_itself'      => esc_html__( 'You can not create a hotspot with target scene to itself', 'rees-real-estate-for-woo' ),
			'add_scene'            => esc_html__( 'Add Scene', 'rees-real-estate-for-woo' ),
			'alert_delete_scene'   => esc_html__( 'Do you want to delete this scene?', 'rees-real-estate-for-woo' ),
			'alert_delete_hotspot' => esc_html__( 'Do you want to delete this hotspot?', 'rees-real-estate-for-woo' ),
			'change_media'         => esc_html__( 'Change Media', 'rees-real-estate-for-woo' ),
			'remove_scene'         => esc_html__( 'Remove Scene', 'rees-real-estate-for-woo' ),
			'scene_name'           => esc_html__( 'Scene Name', 'rees-real-estate-for-woo' ),
			'scene_default'        => esc_html__( 'Scene Default', 'rees-real-estate-for-woo' ),
			'scene_image'          => esc_html__( 'Scene image', 'rees-real-estate-for-woo' ),
			'title'                => esc_html__( 'Title', 'rees-real-estate-for-woo' ),
			'pitch_limit'          => esc_html__( 'Pitch Limit', 'rees-real-estate-for-woo' ),
			'initial_zoom'         => esc_html__( 'Initial Zoom', 'rees-real-estate-for-woo' ),
			'delete_scene'         => esc_html__( 'Delete Scene', 'rees-real-estate-for-woo' ),
			'target_scene'         => esc_html__( 'Target Scene', 'rees-real-estate-for-woo' ),
			'set_target_view'      => esc_html__( 'Set Target View', 'rees-real-estate-for-woo' ),
			'opacity_zoom'         => esc_html__( 'Opacity Zoom', 'rees-real-estate-for-woo' ),
			'dimension'            => esc_html__( 'Dimension', 'rees-real-estate-for-woo' ),
			'text'                 => esc_html__( 'Text', 'rees-real-estate-for-woo' ),
			'delete_hotspot'       => esc_html__( 'Delete Hotspot', 'rees-real-estate-for-woo' ),
			'none'                 => esc_html__( 'None', 'rees-real-estate-for-woo' ),
			'save'                 => esc_html__( 'Save', 'rees-real-estate-for-woo' ),
			'sending_email'        => esc_html__( 'SENDING EMAIL, PLEASE WAIT...', 'rees-real-estate-for-woo' ),
			'enter_fullname'       => esc_html__( 'Please enter your Full Name!', 'rees-real-estate-for-woo' ),
			'enter_phone'          => esc_html__( 'Please enter your Phone!', 'rees-real-estate-for-woo' ),
			'enter_email'          => esc_html__( 'Please enter you Email!', 'rees-real-estate-for-woo' ),
			'email_not_valid'      => esc_html__( 'Your Email address is not Valid!', 'rees-real-estate-for-woo' ),
			'enter_message'        => esc_html__( 'Please enter your Message!', 'rees-real-estate-for-woo' ),
			'deposit'              => esc_html__( 'Deposit', 'rees-real-estate-for-woo' ),
			'deposit_infinity'     => esc_html__( 'Deposit (Infinity%)', 'rees-real-estate-for-woo' ),
			'please_wait'          => esc_html__( 'Please wait ...', 'rees-real-estate-for-woo' ),
			'continue_text'        => esc_html__( 'Continue', 'rees-real-estate-for-woo' ),
			'try_again'            => esc_html__( 'Try Again', 'rees-real-estate-for-woo' ),
			'first_scene'          => esc_html__( 'First Scene', 'rees-real-estate-for-woo'),
		);
	}
}