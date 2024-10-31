<?php defined( 'ABSPATH' ) || exit; ?>
<div class="woore-single-property-area">

    <p class="woore-single-property-area-header" id="woore-travel-title">
        <span><?php esc_html_e( 'travel time', 'rees-real-estate-for-woo' ); ?></span>
        <span class="woore-travel-time-expand">
            <i class="icon icon-woore-chevron-down"></i>
        </span>
    </p>

    <div class="woore-travel-time <?php echo ! empty( $position_component ) ? esc_attr( 'woore-style-' . $position_component ) : ''; ?>">
        <p>
			<?php esc_html_e( 'From', 'rees-real-estate-for-woo' ); ?><?php echo esc_html( $property_full_address ); ?>
        </p>

        <div class="woore-tab" id="woore-travel-tab">
            <div data-target="#driving" class="active"><?php esc_html_e( 'Driving', 'rees-real-estate-for-woo' ); ?></div>
            <div data-target="#transit"><?php esc_html_e( 'Transit', 'rees-real-estate-for-woo' ); ?></div>
            <div data-target="#walking"><?php esc_html_e( 'Walking', 'rees-real-estate-for-woo' ); ?></div>
            <div data-target="#bicycling"><?php esc_html_e( 'Cycling', 'rees-real-estate-for-woo' ); ?></div>
            <span></span>
        </div>

        <div class="woore-travel-table woore-tab-table active" aria-labelledby="driving-tab"></div>
        <div class="woore-travel-table woore-tab-table" aria-labelledby="transit-tab"></div>
        <div class="woore-travel-table woore-tab-table" aria-labelledby="walking-tab"></div>
        <div class="woore-travel-table woore-tab-table" aria-labelledby="bicycling-tab"></div>
        <div class="clear">

            <div class="woore-travel-add-address">
                <div class="vi-hui left icon input">
                    <i class="icon icon-woore-search"></i>
                    <input type="text" id="woore-destination-input"
                           placeholder="<?php esc_attr_e( 'Choose destination', 'rees-real-estate-for-woo' ); ?>">
                    <input type="hidden" id="woore-origin-input" value="<?php echo esc_attr( $property_location ); ?>">
                </div>
                <button id="woore-direction-btn" class="vi-hui primary vi-hui-button" type="button" disabled="disabled"
                        data-tab="driving"><?php esc_attr_e( 'Find Location', 'rees-real-estate-for-woo' ); ?></button>

            </div>

        </div>

    </div>
</div>
