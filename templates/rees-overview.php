<?php defined( 'ABSPATH' ) || exit; ?>
<div class="woore-single-property-area">
    <p class="woore-single-property-area-header"><?php esc_html_e( 'overview', 'rees-real-estate-for-woo' ); ?></p>

    <div class="woore-overview">

		<?php if ( ! empty( $property_year_built ) ) : ?>
            <div class="woore-overview-item">
                <span><strong><?php esc_html_e( 'Year Built', 'rees-real-estate-for-woo' ); ?></strong></span>
                <span><?php echo esc_html( $property_year_built ) ?></span>
            </div>
		<?php endif; ?>

		<?php if ( ! empty( $property_size ) ) : ?>
            <div class="woore-overview-item">
                <span><strong><?php esc_html_e( 'Size', 'rees-real-estate-for-woo' ); ?></strong></span>
                <span><?php echo number_format( esc_html( $property_size ), 0, wc_get_price_decimals(), wc_get_price_thousand_separator() ) . ' ' . esc_html( $unit_size ); ?></span>
            </div>
		<?php endif; ?>

		<?php if ( ! empty( $property_land_area ) ) : ?>
            <div class="woore-overview-item">
                <span><strong><?php esc_html_e( 'Land Area', 'rees-real-estate-for-woo' ); ?></strong></span>
                <span><?php echo number_format( esc_html( $property_land_area ), 0, wc_get_price_decimals(), wc_get_price_thousand_separator() ) . ' ' . esc_html( $unit_land_area ); ?></span>
            </div>
		<?php endif; ?>

		<?php if ( ! empty( $property_bedrooms ) ) : ?>
            <div class="woore-overview-item">
                <span><strong><?php esc_html_e( 'Bedrooms', 'rees-real-estate-for-woo' ); ?></strong></span>
                <span><?php echo esc_html( $property_bedrooms ); ?></span>
            </div>
		<?php endif; ?>

		<?php if ( ! empty( $property_bathrooms ) ) : ?>
            <div class="woore-overview-item">
                <span><strong><?php esc_html_e( 'Bathrooms', 'rees-real-estate-for-woo' ); ?></strong></span>
                <span><?php echo esc_html( $property_bathrooms ) ?></span>
            </div>
		<?php endif; ?>
    </div>

	<?php if ( ! empty( $property_additional_detail ) ) : ?>
        <div>
			<?php echo wp_kses_post( $property_additional_detail ); ?>
        </div>
	<?php endif; ?>
</div>