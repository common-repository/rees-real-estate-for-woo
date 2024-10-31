<?php defined( 'ABSPATH' ) || exit; ?>
<?php wp_nonce_field( 'wrealestate_nonce', '_rees_nonce' ) ?>
<div class="panel" id="woore-basic-info-panel">
    <div class="woocommerce_variable_attributes wc-metabox-content">
        <div class='wc-metabox data'>

			<?php

			woocommerce_wp_select(
				array(
					'id'            => '_woorealestate_type',
					'label'         => esc_html__( 'Type', 'rees-real-estate-for-woo' ),
					'wrapper_class' => 'form-row form-row-first woore-mtb0',
					'placeholder'   => '',
					'desc_tip'      => 'false',
					'description'   => '',
					'options'       => array(
						'for_sale' => esc_html__( 'For Sale', 'rees-real-estate-for-woo' ),
						'for_rent' => esc_html__( 'For Rent', 'rees-real-estate-for-woo' ),
					),
				)
			);

			$woore_active = 'for_rent' === $real_estate_type ? 'woore_active' : '';

			woocommerce_wp_text_input(
				array(
					'id'            => '_woorealestate_price_suffix',
					'class'         => 'short',
					'label'         => esc_html__( 'After Price Label', 'rees-real-estate-for-woo' ),
					'wrapper_class' => 'form-row form-row-first woore-mb0 ' . $woore_active,
					'placeholder'   => '',
					'desc_tip'      => 'true',
					'description'   => esc_html__( 'Example value: Per Month', 'rees-real-estate-for-woo' ),
					'type'          => 'text',
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'            => '_woorealestate_deposit',
					'class'         => 'short wc_input_price',
					'label'         => esc_html__( 'Deposit', 'rees-real-estate-for-woo' ) . ' (' . get_woocommerce_currency_symbol() . ')',
					'wrapper_class' => 'form-row form-row-last woore-mb0 ' . $woore_active,
					'placeholder'   => '',
					'desc_tip'      => 'false',
					'type'          => 'text',
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'                => '_woorealestate_size',
					'class'             => 'woore-input_number short',
					'label'             => esc_html__( 'Size', 'rees-real-estate-for-woo' ) . ' (' . $unit_size . ')',
					'wrapper_class'     => 'form-row form-row-first',
					'placeholder'       => '',
					'desc_tip'          => 'true',
					'description'       => esc_html__( 'Size is floor area of a property.', 'rees-real-estate-for-woo' ),
					'type'              => 'number',
					'custom_attributes' => array(
						'min' => '0'
					),
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'                => '_woorealestate_land_area',
					'class'             => 'woore-input_number short',
					'label'             => esc_html__( 'Land Area', 'rees-real-estate-for-woo' ) . ' (' . $unit_land_area . ')',
					'wrapper_class'     => 'form-row form-row-last',
					'placeholder'       => '',
					'desc_tip'          => 'true',
					'description'       => esc_html__( 'Example value: 2000.', 'rees-real-estate-for-woo' ),
					'type'              => 'number',
					'custom_attributes' => array(
						'min' => '0'
					),
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'                => '_woorealestate_rooms',
					'class'             => 'woore-input_number short',
					'label'             => esc_html__( 'Rooms', 'rees-real-estate-for-woo' ),
					'wrapper_class'     => 'form-row form-row-first woore-mb0',
					'placeholder'       => '',
					'desc_tip'          => 'true',
					'description'       => esc_html__( "Number of Property's rooms", 'rees-real-estate-for-woo' ),
					'type'              => 'number',
					'custom_attributes' => array(
						'min' => '0'
					),
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'                => '_woorealestate_bedrooms',
					'class'             => 'woore-input_number short',
					'label'             => esc_html__( 'Bedrooms', 'rees-real-estate-for-woo' ),
					'wrapper_class'     => 'form-row form-row-last woore-mb0',
					'placeholder'       => '',
					'desc_tip'          => 'true',
					'description'       => esc_html__( 'Example value: 4.', 'rees-real-estate-for-woo' ),
					'type'              => 'number',
					'custom_attributes' => array(
						'min' => '0'
					),
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'                => '_woorealestate_bathrooms',
					'class'             => 'woore-input_number short',
					'label'             => esc_html__( 'Bathrooms', 'rees-real-estate-for-woo' ),
					'wrapper_class'     => 'form-row form-row-first woore-mb0',
					'placeholder'       => '',
					'desc_tip'          => 'true',
					'description'       => esc_html__( 'Example value: 2.', 'rees-real-estate-for-woo' ),
					'type'              => 'number',
					'custom_attributes' => array(
						'min' => '0'
					),
				)
			);

			woocommerce_wp_text_input(
				array(
					'id'                => '_woorealestate_year_built',
					'class'             => 'woore-input_number short',
					'label'             => esc_html__( 'Year Built', 'rees-real-estate-for-woo' ),
					'wrapper_class'     => 'form-row form-row-last woore-mb0',
					'placeholder'       => '',
					'desc_tip'          => 'false',
					'description'       => '',
					'type'              => 'number',
					'custom_attributes' => array(
						'min' => '0'
					),
				)
			);

			?>
            <div class="clear"></div>
        </div>
    </div>
    <div class="woore-product-page-wrapper woore-mb16">
        <h4><?php esc_html_e( 'Additional Details', 'rees-real-estate-for-woo' ); ?></h4>
		<?php
		$content   = $additional_detail;
		$editor_id = 'woorealestate_additional_detail';
		$settings  = array(
			'media_buttons' => false,
			'textarea_rows' => 10,
		);
		wp_editor( $content, $editor_id, $settings );
		?>
    </div>
</div>