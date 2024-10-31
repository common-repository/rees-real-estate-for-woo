<?php defined( 'ABSPATH' ) || exit; ?>
<div class="woore-single-property-area">

    <p class="woore-single-property-area-header"><?php esc_html_e( 'address', 'rees-real-estate-for-woo' ); ?></p>

    <div class="woore-address">
		<?php if ( ! empty( $property_full_address ) ) : ?>
            <div class="wre-property-address">
                <strong><?php esc_html_e( 'Address', 'rees-real-estate-for-woo' ); ?>:</strong>
                <span><?php echo esc_html( $property_full_address ); ?></span>
            </div>
		<?php endif; ?>

        <ul>
			<?php if ( ! empty( $property_country ) ) : ?>
                <li>
                    <strong><?php esc_html_e( 'Country', 'rees-real-estate-for-woo' ); ?>:</strong>
                    <span><?php echo esc_html( $property_country ) ?></span>
                </li>
			<?php endif; ?>

            <?php if ( ! empty( $property_state ) ) : ?>
                <li>
                    <strong><?php esc_html_e( 'Province / State', 'rees-real-estate-for-woo' ); ?>:</strong>
                    <span><?php echo esc_html( $property_state ) ?></span>
                </li>
            <?php endif; ?>

            <?php if ( ! empty( $property_city ) ) : ?>
                <li>
                    <strong><?php esc_html_e( 'City / Town', 'rees-real-estate-for-woo' ); ?>:</strong>
                    <span><?php echo esc_html( $property_city ) ?></span>
                </li>
            <?php endif; ?>

            <?php if ( ! empty( $property_neighborhood ) ) : ?>
                <li>
                    <strong><?php esc_html_e( 'Neighborhood', 'rees-real-estate-for-woo' ); ?>:</strong>
                    <span><?php echo esc_html( $property_neighborhood ) ?></span>
                </li>
            <?php endif; ?>

			<?php if ( ! empty( $property_zip ) ) : ?>
                <li>
                    <strong><?php esc_html_e( 'Postal code / ZIP', 'rees-real-estate-for-woo' ); ?>:</strong>
                    <span><?php echo esc_html( $property_zip ) ?></span>
                </li>
			<?php endif; ?>

        </ul>
		<?php if ( ! empty( $property_full_address ) ) : ?>
            <a href="<?php echo esc_html( 'https://maps.google.com/?' . http_build_query( array( 'q' => esc_html( $property_full_address ) ) ) ); ?>"
               target="_blank">
				<?php esc_html_e( 'Open on Google Maps', 'rees-real-estate-for-woo' ); ?>
            </a>
		<?php endif; ?>
    </div>
	<?php if ( ! empty( $property_location ) && ! empty( $google_map_api ) ) : ?>
        <div class="woore-map" id="open-map">
            <div class="vi-hui white vi-hui-button">
                <i class="icon icon-woore-expand"></i>
            </div>
            <div class="woore-map-overlay"></div>
            <div id="woore-map-canvas"
                 data-location="<?php echo $property_location ? esc_attr( $property_location ) : ''; ?>"></div>
        </div>
	<?php endif; ?>

</div>

<?php if ( ! empty( $property_location ) ) : ?>
    <div class="vi-hui vi-hui-modal" id="woore-map-modal">
        <div class="vi-hui-overlay"></div>
        <div class="modal-content">
            <i class="icon icon-woore-close"></i>
            <div class="vi-hui-modal-body">
                <div class="woore-modal-map-content">
                    <p>
                        <span><?php echo esc_html( $property_full_address ); ?></span>
                    </p>
                    <div id="woore-modal-map-canvas"></div>

                </div>
                <div class="woore-modal-map-actions">
                    <a href="#" class="vi-hui-button woore-modal-map-btn active"
                       data-action="map"><?php esc_html_e( 'Map', 'rees-real-estate-for-woo' ); ?></a>
                    <a href="#" class="vi-hui-button woore-modal-map-btn"
                       data-action="satellite"><?php esc_html_e( 'Satellite', 'rees-real-estate-for-woo' ); ?></a>
                    <a href="#" class="vi-hui-button woore-modal-map-btn"
                       data-action="streetView"><?php esc_html_e( 'Street view', 'rees-real-estate-for-woo' ); ?></a>
                </div>
            </div>
        </div>
    </div>
<?php endif; ?>
