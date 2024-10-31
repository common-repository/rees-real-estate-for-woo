<?php defined( 'ABSPATH' ) || exit; ?>
<div class="woore-single-property-area">

    <p class="woore-single-property-area-header"><?php esc_html_e( 'mortgage calculator', 'rees-real-estate-for-woo' ) ?></p>

    <div class="woore-calculator">

        <div class="vi-hui form">
            <div class="vi-hui vi-hui-row">

                <div class="vi-hui vi-hui-col s-12 sm-6">
                    <div class="field">
                        <label for=""><?php esc_html_e( 'Price', 'rees-real-estate-for-woo' ) ?></label>
                        <input type="number" id="woore-sale-price" min="0" step="1000"
                               placeholder="<?php echo esc_attr( $currency_symbol ); ?>"
                               value="<?php echo esc_attr( $property_price ); ?>">
                    </div>
                </div>

                <div class="vi-hui vi-hui-col s-12 sm-6">
                    <div class="field">
                        <label for="woore-deposit"
                               id="woore-deposit-label"><?php esc_html_e( 'Deposit (10%)', 'rees-real-estate-for-woo' ) ?></label>
                        <input type="number" id="woore-deposit" min="0" step="1000"
                               placeholder="<?php echo esc_attr( $currency_symbol ); ?>"
                               value="<?php echo ! empty( $property_price ) ? esc_attr( $property_price * 0.1 ) : ''; ?>">
                    </div>
                </div>

            </div>

            <div class="vi-hui vi-hui-row">

                <div class="vi-hui vi-hui-col s-12 sm-6">
                    <div class="field">
                        <label for=""><?php esc_html_e( 'Repayment term', 'rees-real-estate-for-woo' ) ?></label>
                        <select id="woore-repayment-term">
                            <option value="1"
                                    selected><?php esc_html_e( '1 year', 'rees-real-estate-for-woo' ) ?></option>
							<?php
							$i = 2;
							while ( $i <= $repayment_year ) :
								?>
                                <option value="<?php echo esc_attr( $i ); ?>"><?php echo esc_html( $i . ' ' );
									esc_html_e( 'years', 'rees-real-estate-for-woo' ); ?></option>
								<?php
								$i ++;
							endwhile;
							?>
                        </select>
                    </div>
                </div>

                <div class="vi-hui vi-hui-col s-12 sm-6">
                    <div class="field">
                        <label for=""><?php esc_html_e( 'Interest rate in %', 'rees-real-estate-for-woo' ) ?></label>
                        <input type="number" id="woore-interest-rate" min="0.01" step="0.01" placeholder="%"
                               value="<?php echo esc_attr( $interest_rate ); ?>">
                    </div>
                </div>

            </div>
        </div>
        <div class="woore-calculator-money">
            <span></span>
        </div>

    </div>

</div>