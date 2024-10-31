<?php
defined( 'ABSPATH' ) || exit;

class REES_Product_Real_Estate extends WC_Product {

	protected $extra_data = array(
		'woorealestate_type'         => '',
		'woorealestate_price_suffix' => '',
		'woorealestate_deposit'      => '',
		'woorealestate_size'         => '',
		'woorealestate_land_area'    => '',
		'woorealestate_rooms'        => '',
		'woorealestate_bedrooms'     => '',
		'woorealestate_bathrooms'    => '',
		'woorealestate_year_built'   => '',
		'woorealestate_state'        => '',
		'woorealestate_city'         => '',
		'woorealestate_country'      => '',
		'woorealestate_neighborhood' => '',
		'woorealestate_zip'          => '',
		'woorealestate_full_address' => ''
	);

	public function __construct( $product = 0 ) {
		parent::__construct( $product );
	}

	public function get_type() {
		return 'real-estate';
	}

//    Getter
	public function get_woorealestate_type( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_type', $context );
	}

	public function get_woorealestate_price_suffix( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_price_suffix', $context );
	}

	public function get_woorealestate_deposit( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_deposit', $context );
	}

	public function get_woorealestate_size( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_size', $context );
	}

	public function get_woorealestate_land_area( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_land_area', $context );
	}

	public function get_woorealestate_rooms( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_rooms', $context );
	}

	public function get_woorealestate_bedrooms( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_bedrooms', $context );
	}

	public function get_woorealestate_bathrooms( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_bathrooms', $context );
	}

	public function get_woorealestate_year_built( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_year_built', $context );
	}

	public function get_woorealestate_state( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_state', $context );
	}

	public function get_woorealestate_city( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_city', $context );
	}

	public function get_woorealestate_country( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_country', $context );
	}

	public function get_woorealestate_neighborhood( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_neighborhood', $context );
	}

	public function get_woorealestate_zip( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_zip', $context );
	}

	public function get_woorealestate_full_address( $context = 'view' ) {
		return $this->get_prop( 'woorealestate_full_address', $context );
	}

//    Setter
	public function set_woorealestate_type( $woorealestate_type ) {
		$this->set_prop( 'woorealestate_type', $woorealestate_type );
	}

	public function set_woorealestate_price_suffix( $woorealestate_price_suffix ) {
		$this->set_prop( 'woorealestate_price_suffix', $woorealestate_price_suffix );
	}

	public function set_woorealestate_deposit( $woorealestate_deposit ) {
		$this->set_prop( 'woorealestate_deposit', $woorealestate_deposit );
	}

	public function set_woorealestate_size( $woorealestate_size ) {
		$this->set_prop( 'woorealestate_size', $woorealestate_size );
	}

	public function set_woorealestate_land_area( $woorealestate_land_area ) {
		$this->set_prop( 'woorealestate_land_area', $woorealestate_land_area );
	}

	public function set_woorealestate_rooms( $woorealestate_rooms ) {
		$this->set_prop( 'woorealestate_rooms', $woorealestate_rooms );
	}

	public function set_woorealestate_bedrooms( $woorealestate_bedrooms ) {
		$this->set_prop( 'woorealestate_bedrooms', $woorealestate_bedrooms );
	}

	public function set_woorealestate_bathrooms( $woorealestate_bathrooms ) {
		$this->set_prop( 'woorealestate_bathrooms', $woorealestate_bathrooms );
	}

	public function set_woorealestate_year_built( $woorealestate_year_built ) {
		$this->set_prop( 'woorealestate_year_built', $woorealestate_year_built );
	}

	public function set_woorealestate_state( $woorealestate_state ) {
		$this->set_prop( 'woorealestate_state', $woorealestate_state );
	}

	public function set_woorealestate_city( $woorealestate_city ) {
		$this->set_prop( 'woorealestate_city', $woorealestate_city );
	}

	public function set_woorealestate_country( $woorealestate_country ) {
		$this->set_prop( 'woorealestate_country', $woorealestate_country );
	}

	public function set_woorealestate_neighborhood( $woorealestate_neighborhood ) {
		$this->set_prop( 'woorealestate_neighborhood', $woorealestate_neighborhood );
	}

	public function set_woorealestate_zip( $woorealestate_zip ) {
		$this->set_prop( 'woorealestate_zip', $woorealestate_zip );
	}

	public function set_woorealestate_full_address( $woorealestate_full_address ) {
		$this->set_prop( 'woorealestate_full_address', $woorealestate_full_address );
	}

	public function get_price_html( $deprecated = '' ) {

		if ( is_shop() ) {
			wp_enqueue_style( 'woore-icons', REES_CONST_F['css_url'] . 'woore-icon.css', '', REES_CONST_F['version'] );

			wp_register_style( 'woore-dummy-handle', false, array(), REES_CONST_F['version'], false );
			wp_enqueue_style( 'woore-dummy-handle' );
			wp_add_inline_style( 'woore-dummy-handle', '.woore-extra-info {display:flex; flex-direction: column; gap: 8px; justify-content: center; color: #333333;}' );

		}
		$unit_size = apply_filters( 'woore_add_unit_size', '' );

		ob_start();
		?>
        <div class="woore-top-subinfo woore-extra-info">
			<?php if ( ( $this->get_woorealestate_type() === 'for_sale' ) && ! empty( $this->get_price() ) && ! empty( $this->get_woorealestate_size() ) ) : ?>
                <span><?php echo wp_kses_post( wc_price( $this->get_price() / $this->get_woorealestate_size() ) ) . '/' . esc_html( $unit_size ) ?></span>
			<?php endif; ?>

			<?php if ( $this->get_woorealestate_type() === 'for_rent' && ! empty( $this->get_woorealestate_deposit() ) ) : ?>
                <span><?php esc_attr_e( 'Deposit:', 'rees-real-estate-for-woo' ); ?><?php echo esc_html( get_woocommerce_currency_symbol() . $this->get_woorealestate_deposit() ) ?></span>
			<?php endif; ?>

            <div class="content">
				<?php if ( ! empty( $this->get_woorealestate_bedrooms() ) ) : ?>
                    <span>
             <i class="icon icon-woore-bed"></i>
             <?php echo esc_html( $this->get_woorealestate_bedrooms() ) ?>
         </span>
				<?php endif; ?>

				<?php if ( ! empty( $this->get_woorealestate_bathrooms() ) ) : ?>
                    <span>
            <i class="icon icon-woore-bath"></i>
            <?php echo esc_html( $this->get_woorealestate_bathrooms() ) ?>
        </span>
				<?php endif; ?>

				<?php if ( ! empty( $this->get_woorealestate_size() ) ) : ?>
                    <span>
            <i class="icon icon-woore-landarea"></i>
            <?php echo number_format( esc_html( $this->get_woorealestate_size() ), 0, wc_get_price_decimal_separator(), wc_get_price_thousand_separator() ) . ' ' . esc_html( $unit_size ); ?>
        </span>
				<?php endif; ?>

            </div>
        </div>
		<?php

		$more_info = ob_get_clean();

		if ( '' === $this->get_price() ) {
			$price = apply_filters( 'woocommerce_empty_price_html', '', $this );
		} elseif ( $this->is_on_sale() ) {
			$price = wc_format_sale_price( wc_get_price_to_display( $this, array( 'price' => $this->get_regular_price() ) ), wc_get_price_to_display( $this ) ) . $this->get_price_suffix();
		} else {
			$price = wc_price( wc_get_price_to_display( $this ) ) . $this->get_price_suffix();
			$price .= $more_info;
		}

		return apply_filters( 'woocommerce_get_price_html', $price, $this );
	}

	public function get_price_suffix( $price = '', $qty = 1 ) {
		$html = '';
		if ( $this->get_woorealestate_type() === 'for_rent' && ! empty( $this->get_woorealestate_price_suffix() ) ) {
			$html = ' / ' . $this->get_woorealestate_price_suffix();
		}

		return apply_filters( 'woocommerce_get_price_suffix', $html, $this, $price, $qty );
	}


}
