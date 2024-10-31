<?php defined( 'ABSPATH' ) || exit; ?>
<div id='real_estate_location_options' class='panel wc-metaboxes-wrapper hidden'>
    <div class="woocommerce_variable_attributes wc-metabox-content">
        <div class="wc-metabox data"><?php
            woocommerce_wp_text_input(
                array(
                    'id'            => '_woorealestate_state',
                    'label'         => esc_html__( 'Province / State', 'rees-real-estate-for-woo' ),
                    'wrapper_class' => 'form-row form-row-first woore-mtb0',
                    'placeholder'   => '',
                    'desc_tip'      => 'false',
                    'description'   => '',
                    'type'          => 'text'
                )
            );

            woocommerce_wp_text_input(
                array(
                    'id'            => '_woorealestate_city',
                    'label'         => esc_html__( 'City / Town', 'rees-real-estate-for-woo' ),
                    'wrapper_class' => 'form-row form-row-last woore-mtb0',
                    'placeholder'   => '',
                    'desc_tip'      => 'false',
                    'description'   => '',
                    'type'          => 'text'
                )
            );

            woocommerce_wp_select(
                array(
                    'id'            => '_woorealestate_country',
                    'label'         => esc_html__( 'Country', 'rees-real-estate-for-woo' ),
                    'wrapper_class' => 'form-row form-row-first woore-mb0',
                    'placeholder'   => '',
                    'desc_tip'      => 'false',
                    'description'   => '',
                    'value'         => empty( $woorealestate_country ) ? WC()->countries->get_base_country() : $woorealestate_country,
                    'options'       => WC()->countries->get_allowed_countries(),
                )
            );

            woocommerce_wp_text_input(
                array(
                    'id'            => '_woorealestate_neighborhood',
                    'label'         => esc_html__( 'Neighborhood', 'rees-real-estate-for-woo' ),
                    'wrapper_class' => 'form-row form-row-last woore-mb0',
                    'placeholder'   => '',
                    'desc_tip'      => 'false',
                    'description'   => '',
                    'type'          => 'text'
                )
            );

			woocommerce_wp_text_input(
				array(
					'id'            => '_woorealestate_full_address',
					'label'         => esc_html__( 'Full address', 'rees-real-estate-for-woo' ),
					'wrapper_class' => 'form-row form-row-first woore-mb0',
					'placeholder'   => '',
					'desc_tip'      => 'false',
					'description'   => '',
					'type'          => 'text'
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'            => '_woorealestate_zip',
					'label'         => esc_html__( 'Zip', 'rees-real-estate-for-woo' ),
					'wrapper_class' => 'form-row form-row-last woore-mb0',
					'placeholder'   => '',
					'desc_tip'      => 'false',
					'description'   => '',
					'type'          => 'text'
				)
			);

			?>
            <div class="clear"></div>
        </div>
    </div>
    <div class="woore-product-page-wrapper woore-mb16">
        <h4><?php esc_html_e( 'Property Location at Google Map', 'rees-real-estate-for-woo' ); ?></h4>
        <div class="woore-product-page-map">
            <input type="hidden" name="woorealestate_property_location" class="woore-map-location-field"
                   value="<?php echo isset( $woorealestate_property_location ) ? esc_attr( $woorealestate_property_location ) : ''; ?>">
            <div class="woore-map-canvas">
                <div class="woore-map-warning">
                    <span><a href="<?php echo esc_url( admin_url( 'admin.php?page=vic-real-estate-setting#/google-map' ) ); ?>" target="_blank"><?php esc_html_e( "Click here", 'rees-real-estate-for-woo' ); ?></a> <?php esc_html_e( 'to add your Google Maps API key and enable this feature.', 'rees-real-estate-for-woo' ); ?></span>
                </div>
            </div>
        </div>
        <span><?php esc_html_e( 'Drag the google map marker to point your property location. You can also use the address field above to search for your property', 'rees-real-estate-for-woo' ); ?></span>
    </div>
</div>