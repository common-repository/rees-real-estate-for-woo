<?php defined( 'ABSPATH' ) || exit; ?>

<div class="woore-single-property-area">
    <p class="woore-single-property-area-header"><?php esc_html_e( 'file attachment', 'rees-real-estate-for-woo' ) ?></p>
    <div class="woore-file-attachment <?php echo ! empty( $position_component ) ? esc_attr( 'woore-style-' . $position_component ) : ''; ?>">
		<?php if ( ! empty( $property_file_attachment ) ) : ?>
			<?php if ( 's2' === $style ) : ?>
            <div class="woore-file-attachment-style1">
                <table class="has-background">
                    <thead>
                    <tr>
                        <th><?php esc_html_e( 'Name', 'rees-real-estate-for-woo' ); ?></th>
                        <th><?php esc_html_e( 'Action', 'rees-real-estate-for-woo' ); ?></th>
                    </tr>
                    </thead>
                    <tbody>
					<?php foreach ( $property_file_attachment as $attachment ) : ?>
                        <tr>
                            <td>
                                <span><?php echo ! empty( $attachment[0] ) ? esc_attr( $attachment[0] ) : '' ?></span>
                            </td>
                            <td>
                                <div class="woore-file-attachment-style1-action">
									<?php if ( woore_is_show( $attachment[1] ) ) : ?>
                                        <a href="<?php echo ! empty( $attachment[1] ) ? esc_attr( $attachment[1] ) : '#' ?>"
                                           class="file-action-item"
                                           target="_blank">
                                            <i class="icon icon-woore-eye"></i>
                                        </a>
									<?php endif; ?>
									<?php if ( woore_is_download( $attachment[1] ) ) : ?>
                                        <a href="<?php echo ! empty( $attachment[1] ) ? esc_attr( $attachment[1] ) : '#' ?>"
                                           class="file-action-item"
                                           download>
                                            <i class="icon icon-woore-download"></i>
                                        </a>
									<?php endif; ?>
									<?php if ( woore_is_print( $attachment[1] ) ) : ?>
                                        <div class="file-action-item print"
                                             data-url="<?php echo esc_url( $attachment[1] ) ?>">
                                            <i class="icon icon-woore-print"></i>
                                        </div>
									<?php endif; ?>
                                </div>
                            </td>
                        </tr>
						<?php
					endforeach;
					?>
                    </tbody>
                </table>
            </div>
		<?php else : ?>
            <div class="woore-file-attachment-style2">
                <div class="files">
					<?php foreach ( $property_file_attachment as $attachment ) : ?>
                        <div class="file-item">
                            <div class="file-info">
                                <div>
                                    <i class="circular inverted icon icon-woore-file"></i>
                                </div>
								<?php if ( woore_is_show( $attachment[1] ) ) : ?>
                                    <a href="<?php echo ! empty( $attachment[1] ) ? esc_attr( $attachment[1] ) : '#' ?>"
                                       class="file-name" target="_blank">
										<?php echo ! empty( $attachment[0] ) ? esc_attr( $attachment[0] ) : '' ?>
                                    </a>
								<?php else : ?>
                                    <div class="file-name isnt-show">
										<?php echo ! empty( $attachment[0] ) ? esc_attr( $attachment[0] ) : '' ?>
                                    </div>
								<?php endif; ?>
                            </div>

                            <div class="file-action">
								<?php if ( woore_is_download( $attachment[1] ) ) : ?>
                                    <a href="<?php echo ! empty( $attachment[1] ) ? esc_attr( $attachment[1] ) : '#' ?>"
                                       class="file-action-item"
                                       download>
                                        <i class="icon icon-woore-download"></i>
                                    </a>
								<?php endif; ?>
								<?php if ( woore_is_print( $attachment[1] ) ) : ?>
                                    <div class="file-action-item print"
                                         data-url="<?php echo esc_url( $attachment[1] ) ?>">
                                        <i class="icon icon-woore-print"></i>
                                    </div>
								<?php endif; ?>
                            </div>
                        </div>
						<?php endforeach; ?>
                </div>
            </div>
		<?php endif; ?>
		<?php endif; ?>
    </div>
</div>