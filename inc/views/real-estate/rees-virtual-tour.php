<?php defined( 'ABSPATH' ) || exit; ?>
<div id="real_estate_tour_options" class="panel wc-metaboxes-wrapper">
    <div class="woocommerce_variable_attributes wc-metabox-content">
        <div class="data">
            <div class="woore-tour-preview-image <?php echo esc_attr( isset( $woore_tour_settings['autoLoad'] ) ? ( $woore_tour_settings['autoLoad'] ? 'collapse' : "" ) : 'collapse' ); ?>">
                <div class="woore-tour-field">
                    <span class="woore-tour-field-title"><?php esc_html_e( 'Tour Autoload:', 'rees-real-estate-for-woo' ); ?></span>
                    <div>
                        <label for="tour_auto_load" class="woore-checkbox">
                            <input type="checkbox" hidden name="woore-tour-auto-load"
                                   id="tour_auto_load" <?php echo esc_attr( isset( $woore_tour_settings['autoLoad'] ) ? ( $woore_tour_settings['autoLoad'] ? 'checked' : "" ) : 'checked' ); ?> >
                            <span></span>
                        </label>
                        <span class="woocommerce-help-tip" tabindex="0"
                              aria-label="<?php esc_attr_e( 'Tour Preview Image will appear if this is turned off.', 'rees-real-estate-for-woo' ); ?>"
                              data-tip="<?php esc_attr_e( 'Tour Preview Image will appear if this is turned off.', 'rees-real-estate-for-woo' ); ?>"></span>
                    </div>
                </div>

                <div class="woore-tour-field woore-mt16">
                    <div class="woore-tour-field-title">
						<?php esc_html_e( "Set a Tour Preview Image:", 'rees-real-estate-for-woo' ); ?>
                    </div>
                    <a href="#"
                       class="woore-custom-media woore-tour-button <?php echo ! empty( $woore_tour_settings['preview'] ) ? esc_attr( 'remove' ) : ''; ?>">
                        <img src="<?php echo isset( $woore_tour_settings['preview'] ) ? esc_url( $woore_tour_settings['preview'] ) : ''; ?>"
                             alt="">
                        <input type="hidden" name="woore-tour-preview-image" value="">
                        <span></span>
                    </a>
                </div>
				<?php
				woocommerce_wp_text_input(
					array(
						'id'            => 'woore-tour-preview-title',
						'class'         => 'short',
						'label'         => esc_html__( 'Preview Image Message:', 'rees-real-estate-for-woo' ),
						'wrapper_class' => 'form-row woore-mb0',
						'placeholder'   => '',
						'desc_tip'      => 'false',
						'description'   => '',
						'type'          => 'text',
						'value'         => isset( $woore_tour_settings['loadButtonLabel'] ) ? esc_attr( $woore_tour_settings['loadButtonLabel'] ) : esc_attr( 'Click To Load Panorama' ),
					)
				); ?>
            </div>
            <div class="woore-tour-field woore-mt16">
                <span class="woore-tour-field-title"><?php esc_html_e( 'Basic Control Buttons:', 'rees-real-estate-for-woo' ); ?></span>
                <div>
                    <label for="tour_basic_control" class="woore-checkbox">
                        <input type="checkbox" hidden name="woore-tour-basic-control"
                               id="tour_basic_control" <?php echo esc_attr( isset( $woore_tour_settings['showControls'] ) ? ( $woore_tour_settings['showControls'] ? 'checked' : '' ) : 'checked' ); ?>>
                        <span></span>
                    </label>
                    <span class="woocommerce-help-tip" tabindex="0"
                          aria-label="<?php esc_attr_e( 'This option will display Zoom In, Zoom Out and Full Screen buttons on the tour.', 'rees-real-estate-for-woo' ); ?>"
                          data-tip="<?php esc_attr_e( 'This option will display Zoom In, Zoom Out and Full Screen buttons on the tour.', 'rees-real-estate-for-woo' ); ?>"></span>
                </div>
            </div>
			<?php

			woocommerce_wp_text_input(
				array(
					'id'                => 'woore-tour-scene-fade-duration',
					'class'             => 'woore-input_number short',
					'label'             => esc_html__( 'Scene Fade Duration:', 'rees-real-estate-for-woo' ),
					'wrapper_class'     => 'form-row woore-mb0',
					'placeholder'       => '',
					'desc_tip'          => true,
					'description'       => esc_html__( 'This will set the scene fade effect and execution time.', 'rees-real-estate-for-woo' ),
					'value'             => isset( $woore_tour_settings['sceneFadeDuration'] ) ? esc_attr( $woore_tour_settings['sceneFadeDuration'] ) : esc_attr( '' ),
					'type'              => 'number',
					'custom_attributes' => array(
						'min' => '0'
					),
				)
			);
			?>

            <div class="woore-tour-auto-rotation <?php echo esc_attr( isset( $woore_tour_settings['checkAutoRotate'] ) ? ( $woore_tour_settings['checkAutoRotate'] ? '' : 'collapse' ) : 'collapse' ); ?> woore-mt16">
                <div class="woore-tour-field">
                    <span class="woore-tour-field-title"><?php esc_html_e( 'Auto Rotation:', 'rees-real-estate-for-woo' ); ?></span>
                    <div>
                        <label for="tour_auto_rotation" class="woore-checkbox">
                            <input type="checkbox" hidden name="woore-tour-auto-rotate-check"
                                   id="tour_auto_rotation" <?php echo esc_attr( isset( $woore_tour_settings['checkAutoRotate'] ) ? ( $woore_tour_settings['checkAutoRotate'] ? 'checked' : '' ) : '' ); ?>>
                            <span></span>
                        </label>
                    </div>
                </div>
                <div class="woore-tour-auto-rotation-content">
                    <p class="form-field form-row woore-mb0">
                        <label for="woore-tour-auto-rotate"><?php esc_html_e( 'Rotation Speed and Direction:', 'rees-real-estate-for-woo' ); ?></label>
                        <span class="woocommerce-help-tip" tabindex="0"
                              aria-label="<?php esc_attr_e( 'Set a value to determine the speed of rotation. The higher the number, the faster it will rotate. Positive values will make it rotate clockwise and negative values will make it rotate anti clockwise', 'rees-real-estate-for-woo' ); ?>"
                              data-tip="<?php esc_attr_e( 'Set a value to determine the speed of rotation. The higher the number, the faster it will rotate. Positive values will make it rotate clockwise and negative values will make it rotate anti clockwise', 'rees-real-estate-for-woo' ); ?>"></span>
                        <input type="number" class="short" style="" name="woore-tour-auto-rotate"
                               id="woore-tour-auto-rotate"
                               value="<?php echo esc_attr( isset( $woore_tour_settings['autoRotate'] ) ? $woore_tour_settings['autoRotate'] : - 5 ); ?>"
                               placeholder="-5">
                    </p>
                    <p class="form-field form-row woore-mb0">
                        <label for="woore-tour-auto-rotate-resume"><?php esc_html_e( 'Resume Auto-rotation after:', 'rees-real-estate-for-woo' ); ?></label>
                        <span class="woocommerce-help-tip" tabindex="0"
                              aria-label="<?php esc_attr_e( 'When someone clicks on the tour, auto-rotation stops. Here, set a time after which auto rotation will start again. Assign in milliseconds, where 1000 milliseconds = 1 second', 'rees-real-estate-for-woo' ); ?>"
                              data-tip="<?php esc_attr_e( 'When someone clicks on the tour, auto-rotation stops. Here, set a time after which auto rotation will start again. Assign in milliseconds, where 1000 milliseconds = 1 second', 'rees-real-estate-for-woo' ); ?>"></span>
                        <input type="number" class="woore-input_number short" style=""
                               name="woore-tour-auto-rotate-resume"
                               id="woore-tour-auto-rotate-resume"
                               value="<?php echo esc_attr( isset( $woore_tour_settings['autoRotateInactivityDelay'] ) ? $woore_tour_settings['autoRotateInactivityDelay'] : '' ); ?>"
                               placeholder="2000">
                    </p>
                    <p class="form-field form-row woore-mb0">
                        <label for="woore-tour-auto-rotate-stop"><?php esc_html_e( 'Stop Auto-rotation after:', 'rees-real-estate-for-woo' ); ?></label>
                        <span class="woocommerce-help-tip" tabindex="0"
                              aria-label="<?php esc_attr_e( 'Set a time after which auto rotation will stop. Assign in milliseconds, where 1000 milliseconds = 1 second.', 'rees-real-estate-for-woo' ); ?>"
                              data-tip="<?php esc_attr_e( 'Set a time after which auto rotation will stop. Assign in milliseconds, where 1000 milliseconds = 1 second.', 'rees-real-estate-for-woo' ); ?>"></span>
                        <input type="number" class="woore-input_number short" style=""
                               name="woore-tour-auto-rotate-stop"
                               id="woore-tour-auto-rotate-stop"
                               value="<?php echo esc_attr( isset( $woore_tour_settings['autoRotateStopDelay'] ) ? $woore_tour_settings['autoRotateStopDelay'] : '' ); ?>"
                               placeholder="2000">
                    </p>
                </div>
            </div>

            <div id="woore-tour-open-editor" class="woore-mt16">
                <span class="dashicons dashicons-plus-alt2"></span>
                <span><?php esc_html_e('Create Tour', 'rees-real-estate-for-woo' );?></span>
                <img src="" alt="">
                <div class="woore-tour-edit-icon">
                    <span class="dashicons dashicons-edit"></span>
                </div>
            </div>
            <div class="clear"></div>
        </div>
    </div>
    <div class="vi-hui vi-hui-modal" id="woore-tour-editor-modal">
        <div class="vi-hui-overlay"></div>
        <div id="vi-hui-toast"></div>
        <div class="modal-content">
            <i class="dashicons dashicons-no-alt"></i>
            <div class="vi-hui-modal-body">
                <div id="woore-tour-preview"></div>
                <div class="woore-tour-container">
                    <div id="woore-tour-preview-button" title="<?php esc_attr_e( "Preview", 'rees-real-estate-for-woo' ); ?>">
                        <span class="dashicons dashicons-arrow-down-alt2"></span>
                        <span class="dashicons dashicons-arrow-up-alt2"></span>
                    </div>
                    <div class="woore-tour-box-add-scene">
                        <div class="woore-tour-box-add-scene-content">
                            <p><?php esc_html_e( "Please add scenes before creating a tour", 'rees-real-estate-for-woo' ); ?></p>
                            <div class="button button-primary woore-tour-add-scene">
								<?php esc_html_e( "Add Scene", 'rees-real-estate-for-woo' ); ?>
                            </div>
                        </div>
                    </div>
                    <div class="woore-tour-content">
                        <div class="woore-tour-sidebar">
                            <div class="woore-tour-sidebar-header">
                                <div class="button woore-tour-add-scene">
                                    <span class="dashicons dashicons-format-image"></span>
									<?php esc_html_e( '+ Scene', 'rees-real-estate-for-woo' ); ?>
                                </div>
                            </div>
                            <div class="woore-tour-scene-list"></div>
                        </div>
                        <div id="woore-tour-panorama"></div>
                        <div class="woore-tour-sidebar">
                            <div class="woore-tour-sidebar-editor-buttons">
                                <div class="woore-tour-sidebar-editor-button active"
                                     data-action="scene"><?php esc_html_e( 'Scene', 'rees-real-estate-for-woo' ); ?></div>
                                <div class="woore-tour-sidebar-editor-button"
                                     data-action="hotspot"><?php esc_html_e( 'Hotspot', 'rees-real-estate-for-woo' ); ?></div>
                            </div>
                            <div id="woore-tour-sidebar-editor"></div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
