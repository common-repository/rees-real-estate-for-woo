<?php defined( 'ABSPATH' ) || exit; ?>
    <div class="woore-single-property-area">
        <p class="woore-single-property-area-header"><?php esc_html_e( 'floor plans', 'rees-real-estate-for-woo' ); ?></p>
		<?php if ( ! empty( $property_floor_plan ) ) : ?>
            <div class="woore-outer-floor">
                <ul class="woore-outer-floor-mobile">
					<?php $i = 0; ?>
					<?php foreach ( $property_floor_plan as $floor ) { ?>
                        <li>
                            <div class="woore-outer-floor-box <?php echo esc_attr( 0 === $i ? 'active' : '' ); ?>">
                    <span>
                        <?php echo esc_html( $floor['name'] ); ?>
                    </span>
                                <span>
                        <i class="icon icon-woore-chevron-down"></i>
                        <i class="icon icon-woore-chevron-up"></i>
                    </span>
                            </div>
                            <a href="#" class="woore-outer-floor-img" data-index="<?php echo esc_attr( $i ); ?>">
								<?php echo ! empty( $floor['image_id'] ) ? wp_get_attachment_image( $floor['image_id'], 'full' ) : wp_kses_post( wc_placeholder_img( 'full' ) ); ?>
                            </a>
                        </li>
						<?php ++ $i;
					} ?>
                </ul>

                <ul class="woore-outer-floor-desktop">
					<?php $j = 0; ?>
					<?php foreach ( $property_floor_plan as $floor ) { ?>
                        <li class="woore-outer-floor-desktop-box">
                            <a href="#" class="woore-outer-floor-desktop-item"
                               data-index="<?php echo esc_attr( $j ); ?>">
                                <span><?php echo esc_html( $floor['name'] ); ?></span>
                                <div>
									<?php echo ! empty( $floor['image_id'] ) ? wp_get_attachment_image( $floor['image_id'], 'full' ) : wp_kses_post( wc_placeholder_img( 'full' ) ); ?>
                                </div>
                            </a>
                        </li>
						<?php ++ $j;
					} ?>
                </ul>
            </div>
		<?php endif; ?>

    </div>

<?php if ( ! empty( $property_floor_plan ) ) : ?>
    <div class="vi-hui vi-hui-modal" id="vi-hui-floor-modal">
        <div class="vi-hui-overlay"></div>
        <div class="modal-content">
            <i class="icon icon-woore-close"></i>
            <div class="vi-hui-modal-body">
				<?php
				$floor_length = count( $property_floor_plan );
				$i            = 0;
				?>
                <div class="woore-floor-plans">
					<?php
					while ( $i < $floor_length ) :
						?>
                        <div class="woore-floor-plans-item <?php echo ( 0 === $i ) ? esc_attr( 'active' ) : ''; ?>"
                             data-index="<?php echo esc_attr( $i ); ?>">

                            <div class="woore-floor-plans-img">
								<?php echo ! empty( $property_floor_plan[ $i ]['image_id'] ) ? wp_get_attachment_image( $property_floor_plan[ $i ]['image_id'], 'full' ) : wp_kses_post( wc_placeholder_img() ); ?>
                                <button class="woore-floor-plans-zoom in" data-zoom-button="in">
                                    <i class="icon icon-woore-plus"></i>
                                </button>
                                <button class="woore-floor-plans-zoom out" data-zoom-button="out" disabled="disabled">
                                    <i class="icon icon-woore-minus"></i>
                                </button>
                            </div>
							<?php if ( ! empty( $property_floor_plan[ $i ]['name'] ) ) : ?>
                                <p class="woore-floor-plans-name"><?php echo esc_html( $property_floor_plan[ $i ]['name'] ); ?></p>
							<?php endif; ?>

							<?php if ( ! empty( $property_floor_plan[ $i ]['size'] ) ) : ?>
                                <span><?php echo number_format( esc_html( $property_floor_plan[ $i ]['size'] ), 0, wc_get_price_decimals(), wc_get_price_thousand_separator() ) . ' ' . esc_html( $unit_size ); ?></span>
							<?php endif; ?>

							<?php
							if ( ! empty( $property_floor_plan[ $i ]['additional_detail'] ) ) {
								echo wp_kses_post( woore_format_additional_detail( $property_floor_plan[ $i ]['additional_detail'] ) );
							}
							?>

                        </div>
						<?php
						++ $i;
					endwhile;
					?>
                </div>
            </div>
        </div>
    </div>
<?php endif; ?>