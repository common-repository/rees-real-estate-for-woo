<?php defined( 'ABSPATH' ) || exit; ?>
<div class="woore-single-property-area">
    <p class="woore-single-property-area-header"><?php esc_html_e( 'video', 'rees-real-estate-for-woo' ); ?></p>
    <div class="woore-video" data-type="<?php echo esc_attr( $video_type ); ?>">

		<?php if ( ! empty( $property_video_image ) ) : ?>
            <div class="woore-video-poster-image">
				<?php echo wp_get_attachment_image( $property_video_image, 'full' ); ?>
                <span>
                    <i class="icon icon-woore-play"></i>
                </span>
            </div>
		<?php endif; ?>

		<?php if ( 'link' === $video_type ) : ?>
            <div id="woore-video-iframe" data-src="<?php echo esc_url( $property_video_url ); ?>"></div>
		<?php else :
			$attr = array(
				'src'      => esc_url( $property_video_url ),
				'height'   => 360,
				'width'    => 640,
				'poster'   => '',
				'loop'     => '',
				'autoplay' => '',
				'muted'    => 'false',
				'preload'  => 'metadata',
				'class'    => 'woore-wp-video-shortcode',
			);

			$content = '';
			echo wp_kses_post( wp_video_shortcode( $attr, $content ) );
			?>

		<?php endif; ?>

    </div>
</div>