<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'woore_is_print ' ) ) {
	function woore_is_print( $url ) {
		$file_info      = pathinfo( $url );
		$file_extension = $file_info['extension'] ?? '';

		$valid_print = array(
			'doc',
			'docx',
			'pdf',
			'txt',
			'rtf',
			'jpg',
			'png',
			'gif',
			'bmp',
			'xls',
			'xlsx',
			'csv',
			'ppt',
			'pptx'
		);

		return in_array( $file_extension, $valid_print, true );

	}
}

if ( ! function_exists( 'woore_is_download' ) ) {
	function woore_is_download( $url ) {
		$file_info      = pathinfo( $url );
		$file_extension = $file_info['extension'] ?? '';

		$valid_download = array(
			'doc',
			'docx',
			'pdf',
			'txt',
			'rtf',
			'jpg',
			'png',
			'gif',
			'bmp',
			'xls',
			'xlsx',
			'csv',
			'mp4',
			'avi',
			'mov',
			'wmv',
			'flv',
			'mkv',
			'zip',
			'rar',
			'7z',
			'tar',
			'gz',
			'webp',
		);

		return in_array( $file_extension, $valid_download, true );
	}
}

if ( ! function_exists( 'woore_is_show' ) ) {
	function woore_is_show( $url ) {
		$file_info      = pathinfo( $url );
		$file_extension = $file_info['extension'] ?? '';

		$invalid_show = array(
			'exe',
			'msi',
			'zip',
			'rar',
			'bat',
			'dll',
			'ini',
			'psd',
		);

		return ! in_array( $file_extension, $invalid_show, true );
	}
}

if ( ! function_exists( 'woore_format_additional_detail' ) ) {
	function woore_format_additional_detail( $content ) {

		if ( function_exists( 'do_blocks' ) ) {
			$content = do_blocks( $content );
		}
		$content = wptexturize( $content );
		$content = convert_smilies( $content );
		$content = convert_chars( $content );
		$content = call_user_func( array( $GLOBALS['wp_embed'], 'run_shortcode' ), $content );
		$content = wpautop( $content );
		$content = shortcode_unautop( $content );
		$content = prepend_attachment( $content );
		$content = do_shortcode( $content );
		$content = wc_do_oembeds( $content );

		return wc_format_product_short_description( $content );
	}
}

if ( ! function_exists( 'woore_set_prefix' ) ) {
	function woore_set_prefix( $prefix, $name ) {

		if ( is_array( $name ) ) {
			foreach ( $name as $key => $value ) {
				$name[ $key ] = woore_set_prefix( $prefix, $value );
			}

			return implode( ' ', $name );

		} else {
			return esc_attr( $prefix . $name );
		}
	}
}

if ( function_exists( 'do_blocks' ) ) {
	add_filter( 'woore_woorealestate_additional_detail', 'do_blocks', 9 );
}
add_filter( 'woore_woorealestate_additional_detail', 'wptexturize' );
add_filter( 'woore_woorealestate_additional_detail', 'convert_smilies' );
add_filter( 'woore_woorealestate_additional_detail', 'convert_chars' );
add_filter( 'woore_woorealestate_additional_detail', 'wpautop' );
add_filter( 'woore_woorealestate_additional_detail', 'shortcode_unautop' );
add_filter( 'woore_woorealestate_additional_detail', 'prepend_attachment' );
add_filter( 'woore_woorealestate_additional_detail', 'do_shortcode', 11 ); // After wpautop().
add_filter( 'woore_woorealestate_additional_detail', 'wc_format_product_short_description', 9999999 );
add_filter( 'woore_woorealestate_additional_detail', 'wc_do_oembeds' );
add_filter( 'woore_woorealestate_additional_detail', array(
	$GLOBALS['wp_embed'],
	'run_shortcode'
), 8 ); // Before wpautop().