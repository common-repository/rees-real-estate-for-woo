<?php defined( 'ABSPATH' ) || exit; ?>
<div id="real_estate_video_options" class="panel wc-metaboxes-wrapper">
    <div class="woocommerce_variable_attributes wc-metabox-content">
        <div class="data">
            <div class="woore-video-content">
                <div class="woore-video-content-image">
                    <p class="form-field form-row ">
                        <label><?php esc_html_e( 'Video Image', 'rees-real-estate-for-woo' ); ?></label>
                        <a href="#"
                           class="woore-custom-media woore-video-button <?php echo esc_attr( ! empty( $woorealestate_video_image ) ? 'remove' : '' ); ?>">
							<?php echo ! empty( $woorealestate_video_image ) ? wp_get_attachment_image( $woorealestate_video_image, 'full', false ) : '<img src="" alt="">'; ?>
                            <input type="hidden" name="woorealestate_video_image"
                                   value="<?php echo ! empty( $woorealestate_video_image ) ? esc_attr( $woorealestate_video_image ) : ''; ?>">
                            <span></span>
                        </a>
                    </p>
                </div>

                <div class="woore-video-content-url">
                    <p class="form-field form-row">
                        <label for="woorealestate_video_url"><?php esc_html_e( 'Video URL', 'rees-real-estate-for-woo' ); ?></label>
                        <span class="woocommerce-help-tip" tabindex="0"
                              aria-label="<?php esc_attr_e( 'Input only URL. YouTube, Vimeo or your video.', 'rees-real-estate-for-woo' ); ?>"
                              data-tip="<?php esc_attr_e( 'Input only URL. YouTube, Vimeo or your video.', 'rees-real-estate-for-woo' ); ?>"></span>
                        <input type="text" class="short" style="" name="woorealestate_video_url"
                               id="woorealestate_video_url"
                               value="<?php echo ! empty( $woorealestate_video_url ) ? esc_attr( $woorealestate_video_url ) : ''; ?>"
                               placeholder="">
                    </p>
                    <a href="#" class="button"
                       id="woore-video-upload"><?php esc_html_e( 'Upload video', 'rees-real-estate-for-woo' ); ?></a>
                </div>

            </div>

        </div>
    </div>
</div>
