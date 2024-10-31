<?php

namespace REES\Inc\Customizer;

defined( 'ABSPATH' ) || exit;

class REES_Customizer_Control_Range_Slider extends \WP_Customize_Control {
	public $type = 'rees-range-slider';

	protected function render_content() {
		?>
        <label>
			<?php
			if ( ! empty( $this->label ) ) {
				printf( '<span class="customize-control-title">%s</span>', esc_html( $this->label ) );
			}
			if ( ! empty( $this->description ) ) {
				printf( '<span class="description customize-control-description">%s</span>', esc_html( $this->description ) );
			}
			?>
            <div class="<?php echo esc_attr( $this->set( 'customize-range' ) ); ?>">
                <div class="vi-ui range <?php echo esc_attr( $this->set( 'customize-range1' ) ); ?>"
                     data-start="<?php echo esc_attr( $this->value() ); ?>" <?php $this->input_attrs(); ?>></div>
                <input type="number" class="<?php echo esc_attr( $this->set( 'customize-range-value' ) ); ?>"
                       value="<?php echo esc_attr( $this->value() ); ?>" <?php $this->link(); ?>>
            </div>
            <div class="<?php echo esc_attr( $this->set( 'customize-range-min-max' ) ); ?>">
                <span class="<?php echo esc_attr( $this->set( 'customize-range-min' ) ); ?>"><?php echo esc_attr( $this->input_attrs['min'] ); ?></span>
                <span class="<?php echo esc_attr( $this->set( 'customize-range-max' ) ); ?>"><?php echo esc_attr( $this->input_attrs['max'] ); ?></span>
            </div>
        </label>
		<?php
	}

	public function enqueue() {
		$suffix = WP_DEBUG ? '' : '.min';
		wp_enqueue_style( 'woore-customize-control-range-slider-style', REES_CONST_F['css_url'] . 'range' . $suffix . '.css', array(), REES_CONST_F['version'] );
		wp_enqueue_script( 'woore_customize-control-range-slider-script', REES_CONST_F['js_url'] . 'range' . $suffix . '.js', array( 'jquery' ), REES_CONST_F['version'], true );
	}

	private function set( $name ) {
		return woore_set_prefix( 'woore-real-estate-search-', $name );
	}

}