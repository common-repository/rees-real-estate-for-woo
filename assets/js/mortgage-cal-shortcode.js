if ( ViWre === undefined ) {
    var ViWre = {};
}
jQuery( document ).ready( function ( $ ) {
    'use strict';

    ViWre.MortgageCalculator = {
        init() {
            this.loadMortgageCalculator();
            this.handleMortgageCalculator();
        },

        handleMortgageCalculator() {
            const self = this;
            $( "#woore-sale-price" ).on( 'input', function () {
                let value = $( this ).val();
                if ( value === '' || parseInt(value, 10 ) < 0 ) {
                    $( this ).val( '' );
                }
                self.loadMortgageCalculator();
            } );

            $( "#woore-deposit" ).on( 'input', function () {
                let value = $( this ).val();
                if ( value === '' || parseFloat( value ) < 0 ) {
                    $( this ).val( '' );
                }
                self.loadMortgageCalculator();
            } );

            $( "#woore-repayment-term" ).on( 'input', function () {
                self.loadMortgageCalculator();
            } );

            $( "#woore-interest-rate" ).on( 'input', function () {
                let value = $( this ).val();
                if ( value === '' || parseFloat( value ) <= 0 ) {
                    $( this ).val( 0.01 );
                }
                self.loadMortgageCalculator();
            } );
        },

        loadMortgageCalculator() {
            $( '.woore-calculator-money span' ).html( `<strong>${VicWreMortCalParams.currencySymbol + this.numberFormat( this.mortgageCalculator(), VicWreMortCalParams.decimals, VicWreMortCalParams.dec_point, VicWreMortCalParams.thousands_step ) }</strong> ${VicWreMortCalParams.i18n.per_month}` );
            this.updateDepositPercent();
        },

        updateDepositPercent() {
            let salePrice = parseInt( $( "#woore-sale-price" ).val(), 10 );

            if ( salePrice !== 0 && ! isNaN(salePrice) ) {
                let percentDeposit = parseInt( ( $( '#woore-deposit' ). val() / salePrice ) * 100, 10 );
                $( '#woore-deposit-label' ).text( `Deposit (${percentDeposit}%)`);
            }else {
                $( '#woore-deposit-label' ).text( `Deposit (Infinity%)`);
            }

        },

        mortgageCalculator() {
            let salePrice = $( "#woore-sale-price" ).val();
            let deposit = $( "#woore-deposit" ).val();
            let repaymentTerm = parseInt( $( "#woore-repayment-term" ).val(), 10 );
            let interestRate = parseFloat( $( "#woore-interest-rate" ).val(), 10 ) / 100;

            let interestRateMonth = interestRate / 12;
            let numberOfPaymentsMonth = repaymentTerm * 12;

            let loanAmount = salePrice - deposit;
            let monthlyPayment = parseFloat( ( loanAmount * interestRateMonth ) / ( 1 - Math.pow( 1 + interestRateMonth, -numberOfPaymentsMonth ) ) ).toFixed( 0 );

            if ( monthlyPayment === 'NaN' || monthlyPayment < 0 ) {
                monthlyPayment = 0;
            }

            return monthlyPayment;
        },

        numberFormat(number, decimals, dec_point, thousands_sep) {
            // *     example: number_format(1234.56, 2, ',', ' ');
            // *     return: '1 234,56'
            number = (number + '').replace(',', '').replace(' ', '');
            var n = !isFinite(+number) ? 0 : +number,
                prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                s = '',
                toFixedFix = function(n, prec) {
                    var k = Math.pow(10, prec);
                    return '' + Math.round(n * k) / k;
                };
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || '';
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
            return s.join(dec);
        },
    }

    ViWre.MortgageCalculator.init();


} );