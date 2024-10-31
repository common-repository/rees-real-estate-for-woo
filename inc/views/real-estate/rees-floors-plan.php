<?php defined( 'ABSPATH' ) || exit; ?>
<div id="real_estate_floors_options" class="panel wc-metaboxes-wrapper hidden">
    <div class="woocommerce_variable_attributes wc-metabox-content">
        <div class="data">
            <div id="woore-floor-items">
				<?php
				if ( ! empty( $woore_floor ) ) :
					$i = 0;
					$woore_floor_length = count( $woore_floor );
					while ( $i < $woore_floor_length ) :
						?>
                        <div class="woore-panel-item active">
                            <div class="woore-panel-header">

                                <h4 class="woore-panel-header-title"><?php echo ! empty( $woore_floor[ $i ]['name'] ) ? esc_html( $woore_floor[ $i ]['name'] ) : esc_html__( 'Floor', 'rees-real-estate-for-woo' ); ?></h4>

                                <div class="woore-panel-wrap-icon">

                                    <div class="woore-panel-close">
                                        <span class="dashicons dashicons-no-alt"></span>
                                    </div>

                                    <div class="woore-panel-switch">
                                        <div></div>
                                        <div></div>
                                    </div>

                                </div>

                            </div>
                            <div class="woore-panel-content">

                                <div class="woore-product-page-wrapper">
                                    <h4><?php esc_html_e( 'Floor Plan Image', 'rees-real-estate-for-woo' ); ?></h4>

                                    <div class="woore-floor-image-wrapper woore-mb16">

                                        <a href="#"
                                           class="woore-custom-media woore-floor-image <?php echo esc_attr( ! empty( $woore_floor[ $i ]['image_id'] ) ? 'remove' : '' ); ?>"
                                           data-index="<?php echo esc_attr( $i ); ?>">
											<?php echo ! empty( $woore_floor[ $i ]['image_id'] ) ? wp_get_attachment_image( $woore_floor[ $i ]['image_id'], 'full', false ) : '<img src="" alt="">' ?>
                                            <input type="hidden"
                                                   name="woorealestate_property_floor[<?php echo esc_attr( $i ); ?>][image_id]"
                                                   value="<?php echo esc_attr( $woore_floor[ $i ]['image_id'] ) ?>">
                                            <span></span>
                                        </a>

                                    </div>
                                </div>


                                <div class="woore-product-page-wrapper">

                                    <p class="form-field form-row form-row-first">
                                        <label for="woorealestate_property_floor_name<?php echo esc_attr( $i ); ?>"><?php esc_html_e( 'Floor Name', 'rees-real-estate-for-woo' ); ?></label>
                                        <span class="woocommerce-help-tip" tabindex="0"
                                              aria-label="<?php esc_attr_e( 'Example value: Ground Floor', 'rees-real-estate-for-woo' ); ?>"
                                              data-tip="<?php esc_attr_e( 'Example value: Ground Floor', 'rees-real-estate-for-woo' ); ?>"></span>
                                        <input type="text" class="short woore_property_floor_name" style=""
                                               name="woorealestate_property_floor[<?php echo esc_attr( $i ); ?>][name]"
                                               id="woorealestate_property_floor_name<?php echo esc_attr( $i ); ?>"
                                               value="<?php echo esc_attr( $woore_floor[ $i ]['name'] ) ?>"
                                               placeholder="">
                                    </p>

                                    <p class="form-field form-row form-row-last">
                                        <label for="woorealestate_property_floor_size<?php echo esc_attr( $i ); ?>"><?php esc_html_e( 'Floor Size', 'rees-real-estate-for-woo' ); ?></label>
                                        <span class="woocommerce-help-tip" tabindex="0"
                                              aria-label="<?php esc_attr_e( 'Example value: 2000.', 'rees-real-estate-for-woo' ); ?>"
                                              data-tip="<?php esc_attr_e( 'Example value: 2000.', 'rees-real-estate-for-woo' ); ?>"></span>
                                        <input type="number" min="0" class="woore-input_number short" style=""
                                               name="woorealestate_property_floor[<?php echo esc_attr( $i ); ?>][size]"
                                               id="woorealestate_property_floor_size<?php echo esc_attr( $i ); ?>"
                                               value="<?php echo esc_attr( $woore_floor[ $i ]['size'] ) ?>"
                                               placeholder="">
                                    </p>

                                    <div class="clear"></div>

                                </div>

                                <div class="woore-product-page-wrapper woore-mb16">

                                    <h4><?php esc_html_e( 'Additional Details', 'rees-real-estate-for-woo' ); ?></h4>
									<?php
									$content   = $woore_floor[ $i ]['additional_detail'];
									$editor_id = 'woore-wp-editor-' . $i;
									$settings  = array(
										'media_buttons' => false,
										'textarea_rows' => 10,
										'textarea_name' => 'woorealestate_property_floor[' . $i . '][additional_detail]'
									);
									wp_editor( $content, $editor_id, $settings );
									?>
                                </div>
                            </div>
                        </div>
						<?php
						$i ++;
					endwhile;
				endif;
				?>
            </div>

            <div class="woore-mt16 button" id="wre-add-floor">
                <span><?php esc_html_e( 'Add Floor', 'rees-real-estate-for-woo' ); ?></span>
            </div>

        </div>
    </div>
</div>