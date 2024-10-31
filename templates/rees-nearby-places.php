<?php defined( 'ABSPATH' ) || exit; ?>

<div class="woore-single-property-area">

    <p class="woore-single-property-area-header"><?php esc_html_e( 'nearby places', 'rees-real-estate-for-woo' ) ?></p>
    <div class="woore-places" data-location="<?php echo esc_attr( $property_location ); ?>">

        <div class="woore-wrap-tab">
            <div class="woore-tab-btn" id="woore-left">
                <i class="icon icon-woore-chervon-left"></i>
            </div>
            <div class="woore-tab" id="woore-nearby-place-tab">
				<?php $i = $j = true; ?>
				<?php foreach ( $nearby_places_field as $key => $value ) { ?>
                    <div data-target="#<?php echo esc_attr( $key ); ?>"
                         class="<?php echo esc_attr( true === $i ? 'active' : '' ); ?>"><?php echo esc_html( $value ); ?></div>
					<?php $i = false; ?>
				<?php } ?>
                <span></span>
            </div>
            <div class="woore-tab-btn" id="woore-right">
                <i class="icon icon-woore-chervon-right"></i>
            </div>
        </div>

		<?php foreach ( $nearby_places_field as $key => $value ) { ?>
            <div class="woore-nearby-places-table woore-tab-table <?php echo esc_attr( true === $j ? 'active' : '' ); ?>"
                 aria-labelledby="<?php echo esc_attr( $key ); ?>-tab"><?php esc_html_e( 'Not Found', 'rees-real-estate-for-woo' ); ?></div>
			<?php $j = false; ?>
		<?php } ?>

    </div>

</div>