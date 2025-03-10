/** @odoo-module */

import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";

import { usePos } from "@point_of_sale/app/store/pos_hook";

import { Order, Orderline } from "@point_of_sale/app/store/models";

import {
  formatFloat,
  roundDecimals as round_di,
  roundPrecision as round_pr,
  floatIsZero,
} from "@web/core/utils/numbers";

import { patch } from "@web/core/utils/patch";

import { PosStore } from "@point_of_sale/app/store/pos_store";

const OriginalOnNumpadClick = ProductCard.prototype.press;

patch(Orderline.prototype, {
  setup(_defaultObj, options) {
    super.setup(...arguments);

    // this.posHook = usePos();

    this.withOffer = false;

    this.offerArray = (function () {
      const programs = options.pos.programs.filter(
        (p) => p.program_type === "buy_x_with_y"
      );

      let mappedArray = programs[0].rules.map((rule, index) => {
        return {
          includedProductIds: Array.from(rule.valid_product_ids),

          targetQuantity: rule.minimum_qty,

          targetQuantityPrice: programs[0].rewards[index].discount_max_amount,

          ruleId: rule.id,

          rewardId: programs[0].rewards[index].id
        };
      });

      return mappedArray;
    })();
  },

//   set_quantity_with_offer(quantity, keep_price) {
//     this.order.assert_editable();
//     var quant =
//         typeof quantity === "number" ? quantity : oParseFloat("" + (quantity ? quantity : 0));
//     if (this.refunded_orderline_id in this.pos.toRefundLines) {
//         const toRefundDetail = this.pos.toRefundLines[this.refunded_orderline_id];
//         const maxQtyToRefund =
//             toRefundDetail.orderline.qty - toRefundDetail.orderline.refundedQty;
//         if (quant > 0) {
//             this.env.services.popup.add(ErrorPopup, {
//                 title: _t("Positive quantity not allowed"),
//                 body: _t(
//                     "Only a negative quantity is allowed for this refund line. Click on +/- to modify the quantity to be refunded."
//                 ),
//             });
//             return false;
//         } else if (quant == 0) {
//             toRefundDetail.qty = 0;
//         } else if (-quant <= maxQtyToRefund) {
//             toRefundDetail.qty = -quant;
//         } else {
//             this.env.services.popup.add(ErrorPopup, {
//                 title: _t("Greater than allowed"),
//                 body: _t(
//                     "The requested quantity to be refunded is higher than the refundable quantity of %s.",
//                     this.env.utils.formatProductQty(maxQtyToRefund)
//                 ),
//             });
//             return false;
//         }
//     }
//     var unit = this.get_unit();
//     if (unit) {
//         if (unit.rounding) {
//             var decimals = this.pos.dp["Product Unit of Measure"];
//             var rounding = Math.max(unit.rounding, Math.pow(10, -decimals));
//             this.quantity = round_pr(quant, rounding);
//             this.quantityStr = formatFloat(this.quantity, {
//                 digits: [69, decimals],
//             });
//         } else {
//             this.quantity = round_pr(quant, 1);
//             this.quantityStr = this.quantity.toFixed(0);
//         }
//     } else {
//         this.quantity = quant;
//         this.quantityStr = "" + this.quantity;
//     }

//     // just like in sale.order changing the quantity will recompute the unit price
//     if (!keep_price && this.price_type === "original") {
//         // offer logic to be used in numpad
//         this.set_unit_price(
//             this.product.get_price(
//                 this.order.pricelist,
//                 this.get_quantity(),
//                 this.get_price_extra()
//             )
//         );
//         this.order.fix_tax_included_price(this);
//     }
//     return true;
// },

  // when we add an new orderline we want to merge it with the last line to see reduce the number of items

  // in the orderline. This returns true if it makes sense to merge the two

  can_be_merged_with(orderline) {
    var price = parseFloat(
      round_di(this.price || 0, this.pos.dp["Product Price"]).toFixed(
        this.pos.dp["Product Price"]
      )
    );

    var order_line_price = orderline

      .get_product()

      .get_price(orderline.order.pricelist, this.get_quantity());

    order_line_price = round_di(
      orderline.compute_fixed_price(order_line_price),

      this.pos.currency.decimal_places
    );

    var includedProductUniqueIdsInAllRules = Array.from(
      new Set(this.offerArray.flatMap((obj) => obj.includedProductIds))
    );

    // only orderlines of the same product can be merged

    if (
      includedProductUniqueIdsInAllRules.includes(orderline.get_product().id)
    ) {
      return (
        !this.skipChange &&
        orderline.getNote() === this.getNote() &&
        this.get_product().id === orderline.get_product().id &&
        this.get_unit() &&
        this.is_pos_groupable() &&
        // don't merge discounted orderlines

        this.get_discount() === 0 &&
        // there will be difference if custom function is invoked therefore we comments those lines out

        // floatIsZero(

        //     price - order_line_price - orderline.get_price_extra(),

        //     this.pos.currency.decimal_places

        // ) &&

        !(
          this.product.tracking === "lot" &&
          (this.pos.picking_type.use_create_lots ||
            this.pos.picking_type.use_existing_lots)
        ) &&
        this.full_product_name === orderline.full_product_name &&
        orderline.get_customer_note() === this.get_customer_note() &&
        !this.refunded_orderline_id &&
        !this.isPartOfCombo() &&
        !orderline.isPartOfCombo()
      );
    } else {
      return (
        !this.skipChange &&
        orderline.getNote() === this.getNote() &&
        this.get_product().id === orderline.get_product().id &&
        this.get_unit() &&
        this.is_pos_groupable() &&
        // don't merge discounted orderlines

        this.get_discount() === 0 &&
        floatIsZero(
          price - order_line_price - orderline.get_price_extra(),

          this.pos.currency.decimal_places
        ) &&
        !(
          this.product.tracking === "lot" &&
          (this.pos.picking_type.use_create_lots ||
            this.pos.picking_type.use_existing_lots)
        ) &&
        this.full_product_name === orderline.full_product_name &&
        orderline.get_customer_note() === this.get_customer_note() &&
        !this.refunded_orderline_id &&
        !this.isPartOfCombo() &&
        !orderline.isPartOfCombo()
      );
    }
  },
});

patch(Order.prototype, {
  async add_product(product, options) {
    if (
      this.pos.doNotAllowRefundAndSales() &&
      this._isRefundOrder() &&
      (!options.quantity || options.quantity > 0)
    ) {
      this.pos.env.services.popup.add(ErrorPopup, {
        title: _t("Refund and Sales not allowed"),

        body: _t("It is not allowed to mix refunds and sales"),
      });

      return;
    }

    if (this._printed) {
      // when adding product with a barcode while being in receipt screen

      this.pos.removeOrder(this);

      return this.pos.add_new_order().add_product(product, options);
    }

    this.assert_editable();

    options = options || {};

    const quantity = options.quantity ? options.quantity : 1;

    const line = new Orderline(
      { env: this.env },

      { pos: this.pos, order: this, product: product, quantity: quantity }
    );

    this.fix_tax_included_price(line);

    this.set_orderline_options(line, options);

    line.set_full_product_name();

    var to_merge_orderline;

    for (var i = 0; i < this.orderlines.length; i++) {
      if (
        this.orderlines.at(i).can_be_merged_with(line) &&
        options.merge !== false
      ) {
        to_merge_orderline = this.orderlines.at(i);
      }
    }

    // this block relates to logic that will decide if we would add the orderline, merge or remove and merge

    var includedProductUniqueIdsInAllRules = Array.from(
      new Set(line.offerArray.flatMap((obj) => obj.includedProductIds))
    );

    var targetQuantityWithOfferPrice = line.offerArray.reduce((acc, obj) => {
      acc[obj.targetQuantity] = obj.targetQuantityPrice;

      return acc;
    }, {});

    var totalCustomProducts = 0;

    var customProductLines = [];

    var presentLinesOfSameProduct = [];

    var sumOfQuantitiesOfLinesOfSameProduct = 0;

    // Calculate how many of the custom-priced products are in the cart

    for (var orderline of this.orderlines) {
      var productId = orderline.get_product().id;

      if (includedProductUniqueIdsInAllRules.includes(productId)) {
        totalCustomProducts += orderline.get_quantity();

        customProductLines.push(orderline);
      }

      if (line.product.id === productId) {
        sumOfQuantitiesOfLinesOfSameProduct += orderline.get_quantity();

        presentLinesOfSameProduct.push(orderline);
      }
    }

    var total_price;

    var price_per_product;

    var targetQuantityArray = [...Object.keys(targetQuantityWithOfferPrice)];

    var minimumOfferQuantity = Math.min(...targetQuantityArray);

    var maximumOfferQuantity = Math.max(...targetQuantityArray);

    var minimumOfferPrice = targetQuantityWithOfferPrice[minimumOfferQuantity];

    var maximumOfferPrice = targetQuantityWithOfferPrice[maximumOfferQuantity];

    var multiplier;

    const offerProductIds = customProductLines.map((obj) => obj.product.id);

    const hasDuplicateOfferProductIds =
      new Set(offerProductIds).size !== offerProductIds.length;

    var toBeMergedQuantity =
      line.quantity + sumOfQuantitiesOfLinesOfSameProduct;






      var firstLineOfSameProduct = presentLinesOfSameProduct[0];

      var lastLineOfSameProduct = presentLinesOfSameProduct.at(-1);
      var matchedOffersArray = 0;
      var matchedTargetQuantity = 0;
      var matchedTargetQuantityPrice = 0;
      var matchedRuleId = 0;
      var matchedRewardId = 0;
      var matchedLinesGroupedByOfferQuantityAndPrice = [];
      console.log(toBeMergedQuantity)

      console.log(this.orderlines) // each line of orderlines has updated qty after numpad hitting

      var lineProductId = line.get_product().id;
      // we need to decide if we add, merge or remove lines
      for (var orderline of this.orderlines) {
        // search inside each offer object for orderline product. if found, add this offer to the following array
        matchedOffersArray = line.offerArray.filter((obj) => obj.includedProductIds.includes(lineProductId));
        console.log('L345', matchedOffersArray)
      }

      if (to_merge_orderline) {
        if (matchedOffersArray.length > 0) {
          var offersTargetQty = matchedOffersArray.map(offer => offer.targetQuantity);
          if (matchedOffersArray.length > 1) {
            var linesOfProductIncludedInMultipleOffers = this.orderlines.filter(orderline => {
              // search orderlines for lines that have products included in matched offers
              return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
            });
            // get lines with same product
            var productFrequencyMapInLines = {};
            linesOfProductIncludedInMultipleOffers.forEach(line => {
              const keyValue = line.get_product().id;
              for (let i = 0; i < this.orderlines.length; i++) {
                if (line.get_product().id === this.orderlines[i].get_product().id) {
                  productFrequencyMapInLines[keyValue] = (productFrequencyMapInLines[keyValue] || 0) + 1;
                }
              }
            });
            var linesOfSameProductsinMultipleOffers = linesOfProductIncludedInMultipleOffers.filter(line => {
              const keyValue = line.get_product().id;
              return productFrequencyMapInLines[keyValue] > 1;
            });
            // Step 1: Create an empty object to hold the grouped results
            var linesOfSameProductsGroupedByProductId = {};

            // Step 2: Iterate through the array of objects
            linesOfSameProductsinMultipleOffers.forEach(line => {
              const productId = line.get_product().id; // Destructure productId from the line

              // If the productId doesn't exist in the grouped object, create an array for it
              if (!linesOfSameProductsGroupedByProductId[productId]) {
                  linesOfSameProductsGroupedByProductId[productId] = [];
              }

              // Push the current line into the array for this productId
              linesOfSameProductsGroupedByProductId[productId].push(line);
            });
            // get sum of qty of lines with product included in multiple offer
            /** test 2 */
            var sumOfOfferLinesQty = linesOfProductIncludedInMultipleOffers.reduce((acc, current) => acc + current.quantity, 0);
            offersTargetQty = matchedOffersArray.map(offer => offer.targetQuantity);
            function canSum(target, numbers) {
              const dp = new Array(target + 1).fill(null).map(() => ({ combination: null, length: Infinity }));
              dp[0] = { combination: {}, length: 0 };
            
              for (let num of numbers) {
                for (let j = num; j <= target; j++) {
                  if (dp[j - num].length + 1 < dp[j].length) {
                    dp[j] = {
                      combination: { ...dp[j - num].combination, [num]: (dp[j - num].combination[num] || 0) + 1 },
                      length: dp[j - num].length + 1
                    };
                  }
                }
              }
            
              if (dp[target].length === Infinity) {
                return null; // No combination found
              } else {
                return dp[target].combination; // Return the combination with the least amount of summation operations
              }
            }
            var arrSummedQtyCombinations = canSum(sumOfOfferLinesQty + 1, offersTargetQty) // returns an object with keys as offer targetQty and their values as number of times of each Qty
            console.log('L411', arrSummedQtyCombinations)
            if (arrSummedQtyCombinations ) { // test 1
              
              // Check if offer qty is sum of any or all offer qty. Decide what lines should be merged and then Apply offer
              // Step 2.1: merge or unlink and merge the added line
              if (firstLineOfSameProduct === lastLineOfSameProduct) {
                /** We must check if there're one or two lines of the same product
                we should also check of offer products are on separate lines **/
                console.log('L418', 'sum of one present line')
                firstLineOfSameProduct.merge(line);
              } else {
              console.log('L418', 'sum of two present line')
                this._unlinkOrderline(lastLineOfSameProduct);
    
                firstLineOfSameProduct.merge(lastLineOfSameProduct);
    
                firstLineOfSameProduct.merge(line);
              }
              // Step 2.2: merge separate lines of other products in the summed offers
              for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                console.log('L521', linesProductIdGrouping, line.get_product().id)
                // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                if (linesProductIdGrouping !== line.get_product().id.toString()) { // test 1
                    // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                      console.log('L525', linesProductIdGrouping)
                      // start from second line to be merged
                      linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                      this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                    // }
                
                }
              }

              
              /** test 2 */
              // Step 2.3: Apply offer price
              // Filter offers based on targetQuantity
              const offerPriceCombination = Object.keys(arrSummedQtyCombinations).map(key => {
                const obj = matchedOffersArray.find(item => item.targetQuantity === parseInt(key));
                if (obj) {
                  return obj.targetQuantityPrice * arrSummedQtyCombinations[key];
                } else {
                  return 0;
                }
              });
              

              console.log('L451', offerPriceCombination)
              // Calculate the sum of targetQuantityPrice of selected promotions
              const totalTargetQuantityPrice = offerPriceCombination.reduce((acc, current) => acc + current, 0);
              console.log('L456', totalTargetQuantityPrice)
              /** test 2 */
              price_per_product =
              totalTargetQuantityPrice / (sumOfOfferLinesQty + 1); // Price for each product

              /** we could select the first line of each grouping because it's the one merged into */
              var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                // search orderlines for lines that have products included in matched offers
                return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
              });

              linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                modifiedLine.set_unit_price(price_per_product);
              });




            } else {
              if (offersTargetQty.some(value => (sumOfOfferLinesQty + 1) % value === 0)) {
                // Find all values in the array that divide (sumOfOfferLinesQty + 1) without a remainder
                const divisibleValues = offersTargetQty.filter(value => (sumOfOfferLinesQty + 1) % value === 0);
                console.log('L475', 'lines qty has a multiplier')
                // Check if more than one value divides (sumOfOfferLinesQty + 1)
                if (divisibleValues.length > 1) {
                  // Choose the offer with greatest number of products
                  const greatestOfferQty = Math.max(...divisibleValues);
                  console.log('L480', 'lines qty has multiple multipliers')

                  // Step 2.1: merge or unlink and merge the added line
                  if (firstLineOfSameProduct === lastLineOfSameProduct) {
                    /** We must check if there're one or two lines of the same product
                    we should also check of offer products are on separate lines **/
      
                    firstLineOfSameProduct.merge(line);
                  } else {
                  
                    this._unlinkOrderline(lastLineOfSameProduct);
        
                    firstLineOfSameProduct.merge(lastLineOfSameProduct);
        
                    firstLineOfSameProduct.merge(line);
                  }
                  /** test 1 */
                  console.log('L497', linesOfProductIncludedInMultipleOffers)
                  linesOfSameProductsinMultipleOffers = linesOfProductIncludedInMultipleOffers.filter(line => {
                    const keyValue = line.get_product().id;
                    return productFrequencyMapInLines[keyValue] > 1;
                  });
                  console.log('L502', linesOfSameProductsinMultipleOffers)
                  linesOfSameProductsGroupedByProductId = {};

                  // Step 2: Iterate through the array of objects
                  linesOfSameProductsinMultipleOffers.forEach(line => {
                    const productId = line.get_product().id; // Destructure productId from the line

                    // If the productId doesn't exist in the grouped object, create an array for it
                    if (!linesOfSameProductsGroupedByProductId[productId]) {
                        linesOfSameProductsGroupedByProductId[productId] = [];
                    }

                    // Push the current line into the array for this productId
                    linesOfSameProductsGroupedByProductId[productId].push(line);
                  });
                  /** test 1 */
                  // Step 2.2: merge separate lines of other products in the summed offers
                  console.log('L519', linesOfSameProductsGroupedByProductId)
                  for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                    console.log('L521', linesProductIdGrouping, line.get_product().id)
                    // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                    if (linesProductIdGrouping !== line.get_product().id.toString()) { // test 1
                        // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                          console.log('L525', linesProductIdGrouping)
                          // start from second line to be merged
                          linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                          this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                        // }
                    
                    }
                  }

                  

                  // Step 2.3: Apply offer price

                  // select the targetQtyPrice
                  const selectedTargetQuantityPrice = matchedOffersArray.find(item => item.targetQuantity === greatestOfferQty).targetQuantityPrice;
                  const selectedTargetQuantityMultiplier =  (sumOfOfferLinesQty + 1) / greatestOfferQty // test 1
                  
                  price_per_product = // test 2
                  (selectedTargetQuantityPrice * selectedTargetQuantityMultiplier) / (sumOfOfferLinesQty + 1); // Price for each product

                  /** we could select the first line of each grouping because it's the one merged into */
                  var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                    // search orderlines for lines that have products included in matched offers
                    return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
                  });

                  linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                    modifiedLine.set_unit_price(price_per_product);


              });

                } else {
                  // lines qty is exactly one of the offers qty
                  // Choose the offer with greatest number of products (actually it's one product but the same logic can still be applied)
                  const greatestOfferQty = Math.max(...divisibleValues);
                  console.log('L536', 'lines qty has only one multiplier')

                  // Step 2.1: merge or unlink and merge the added line
                  if (firstLineOfSameProduct === lastLineOfSameProduct) {
                    /** We must check if there're one or two lines of the same product
                    we should also check of offer products are on separate lines **/
      
                    firstLineOfSameProduct.merge(line);
                  } else {
                  
                    this._unlinkOrderline(lastLineOfSameProduct);
        
                    firstLineOfSameProduct.merge(lastLineOfSameProduct);
        
                    firstLineOfSameProduct.merge(line);
                  }
                  // Step 2.2: merge separate lines of other products in the summed offers
                  console.log('L517', linesOfSameProductsGroupedByProductId)
                  for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                    console.log('L579', linesProductIdGrouping, line.get_product().id)
                    // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                    if (linesProductIdGrouping !== line.get_product().id.toString()) { // test 1
                        // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                          console.log('L583', linesProductIdGrouping)
                          // start from second line to be merged
                          linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                          this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                        // }
                    
                    }
                  }

                  

                  // Step 2.3: Apply offer price

                  // select the targetQtyPrice
                  const selectedTargetQuantityMultiplier =  (sumOfOfferLinesQty + 1) / greatestOfferQty // test 1
                  const selectedTargetQuantityPrice = matchedOffersArray.find(item => item.targetQuantity === greatestOfferQty).targetQuantityPrice;
                  price_per_product = // test 1
                  (selectedTargetQuantityPrice * selectedTargetQuantityMultiplier) / (sumOfOfferLinesQty + 1); // Price for each product

                  /** we could select the first line of each grouping because it's the one merged into */
                  var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                    // search orderlines for lines that have products included in matched offers
                    return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
                  });

                  linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                    modifiedLine.set_unit_price(price_per_product);


                  });

                }

              } else {
                // lines qty is not a multiplier of any offer
                var smallestOfferQty = Math.min(...offersTargetQty)
                if ((sumOfOfferLinesQty + 1) > smallestOfferQty) {
                  console.log('L594', 'offer plus one')
                  // if (offersTargetQty.some(value => (sumOfOfferLinesQty) % value === 0)) { // test 1
                  if (firstLineOfSameProduct === lastLineOfSameProduct) { // test 1
                    // quick workaround to check if present lines qty is a multiplier of an offer qty i.e. added line is a plus one
                    // then add the new line leaving the lines with offer applied
                    console.log('L598', 'offer plus one')
                    this.add_orderline(line);

                    this.select_orderline(this.get_last_orderline());
                  } else {
                    lastLineOfSameProduct.merge(line); // test 1
                  }
                } else {
                  // lines qty didn't reach the smallest qty of offers
                  firstLineOfSameProduct.merge(line);
                  
                }

              }
            }
          } else {
            // product is found in one offer only
            
            if (offersTargetQty.some(value => (sumOfOfferLinesQty + 1) % value === 0)) {
              // Find all values in the array that divide (sumOfOfferLinesQty + 1) without a remainder
              const divisibleValues = offersTargetQty.filter(value => (sumOfOfferLinesQty + 1) % value === 0);

                // lines qty is exactly one of the offers qty
                // Choose the offer with greatest number of products (actually it's one product but the same logic can still be applied)
                const greatestOfferQty = Math.max(...divisibleValues);


                // Step 2.1: merge or unlink and merge the added line
                if (firstLineOfSameProduct === lastLineOfSameProduct) {
                  /** We must check if there're one or two lines of the same product
                  we should also check of offer products are on separate lines **/
    
                  firstLineOfSameProduct.merge(line);
                } else {
                
                  this._unlinkOrderline(lastLineOfSameProduct);
      
                  firstLineOfSameProduct.merge(lastLineOfSameProduct);
      
                  firstLineOfSameProduct.merge(line);
                }
                // Step 2.2: merge separate lines of other products in the summed offers
                for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                  console.log('L521', linesProductIdGrouping, line.get_product().id)
                  // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                  if (linesProductIdGrouping !== line.get_product().id.toString()) { // test 1
                      // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                        console.log('L525', linesProductIdGrouping)
                        // start from second line to be merged
                        linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                        this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                      // }
                  
                  }
                }

                

                // Step 2.3: Apply offer price

                // select the targetQtyPrice
                const selectedTargetQuantityPrice = matchedOffersArray.find(item => item.targetQuantity === greatestOfferQty).targetQuantityPrice;
                
                price_per_product =
                selectedTargetQuantityPrice / (sumOfOfferLinesQty + 1); // Price for each product

                /** we could select the first line of each grouping because it's the one merged into */
                var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                  // search orderlines for lines that have products included in matched offers
                  return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
                });

                linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                  modifiedLine.set_unit_price(price_per_product);


                });

              

            } else {
              // added line is in single offer and line qty is not a multiplier

              var smallestOfferQty = Math.min(...offersTargetQty)
              if ((sumOfOfferLinesQty + 1) > smallestOfferQty) {
                if (offersTargetQty.some(value => (sumOfOfferLinesQty) % value === 0)) {
                  // quick workaround to check if present lines qty is a multiplier of an offer qty i.e. added line is a plus one
                  // then add the new line leaving the lines with offer applied

                  this.add_orderline(line);

                  this.select_orderline(this.get_last_orderline());
                } else {
                  lastLineOfSameProduct.merge(line);
                }
              } else {
                // lines qty didn't reach the smallest qty of offers
                firstLineOfSameProduct.merge(line);
                
              }

            }
          }
        } else {
          // not included in any offer

          firstLineOfSameProduct.merge(line);
        }
      } else {
        // if there's no identical product in present orderlines to be merged with
        // add new line





        // ********** NO MERGE **********

        if (matchedOffersArray.length > 0) {
          if (matchedOffersArray.length > 1) {
            var linesOfProductIncludedInMultipleOffers = this.orderlines.filter(orderline => {
              // search orderlines for lines that have products included in matched offers
              return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
            });
            // get lines with same product
            var productFrequencyMapInLines = {}
            linesOfProductIncludedInMultipleOffers.forEach(line => {
              const keyValue = line.get_product().id;
              for (let i = 0; i < this.orderlines.length; i++) {
                if (line.get_product().id === this.orderlines[i].get_product().id) {
                  productFrequencyMapInLines[keyValue] = (productFrequencyMapInLines[keyValue] || 0) + 1;
                }
              }
            });
            var linesOfSameProductsinMultipleOffers = linesOfProductIncludedInMultipleOffers.filter(line => {
              const keyValue = line.get_product().id;
              return productFrequencyMapInLines[keyValue] > 1;
            });
            // Step 1: Create an empty object to hold the grouped results
            var linesOfSameProductsGroupedByProductId = {};

            // Step 2: Iterate through the array of objects
            linesOfSameProductsinMultipleOffers.forEach(line => {
                const productId = line.get_product().id; // Destructure productId from the line

                // If the productId doesn't exist in the grouped object, create an array for it
                if (!linesOfSameProductsGroupedByProductId[productId]) {
                    linesOfSameProductsGroupedByProductId[productId] = [];
                }

                // Push the current line into the array for this productId
                linesOfSameProductsGroupedByProductId[productId].push(line);
            });
            // get sum of qty of lines with product included in multiple offer            
            var sumOfOfferLinesQty = linesOfProductIncludedInMultipleOffers.reduce((acc, current) => acc + current.quantity, 0);
            var offersTargetQty = matchedOffersArray.map(offer => offer.targetQuantity);
            function canSum(target, numbers) {
              const dp = new Array(target + 1).fill(null).map(() => ({ combination: null, length: Infinity }));
              dp[0] = { combination: {}, length: 0 };
            
              for (let num of numbers) {
                for (let j = num; j <= target; j++) {
                  if (dp[j - num].length + 1 < dp[j].length) {
                    dp[j] = {
                      combination: { ...dp[j - num].combination, [num]: (dp[j - num].combination[num] || 0) + 1 },
                      length: dp[j - num].length + 1
                    };
                  }
                }
              }
            
              if (dp[target].length === Infinity) {
                return null; // No combination found
              } else {
                return dp[target].combination; // Return the combination with the least amount of summation operations
              }
            }
            var arrSummedQtyCombinations = canSum(sumOfOfferLinesQty + 1, offersTargetQty)
            console.log('L812', arrSummedQtyCombinations)
            if (arrSummedQtyCombinations) {
              console.log('L814: sum of multiple offer but no merge')
              // Check if offer qty is sum of any or all offer qty. Decide what lines should be merged and then Apply offer
              // Step 2.1: add the added line

              this.add_orderline(line);

              this.select_orderline(this.get_last_orderline());
              
              // Step 2.2: merge separate lines of other products in the summed offers
              for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                console.log('L824', linesProductIdGrouping, line.get_product().id)
                // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                if (linesProductIdGrouping !== line.get_product().id.toString()) {
                    // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                      console.log('L528', linesProductIdGrouping)
                      // start from second line to be merged
                      linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                      this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                    // }
                
                }
              }

              

              // Step 2.3: Apply offer price
              // Filter offers based on targetQuantity
              
              const offerPriceCombination = Object.keys(arrSummedQtyCombinations).map(key => {
                const obj = matchedOffersArray.find(item => item.targetQuantity === parseInt(key));
                if (obj) {
                  return obj.targetQuantityPrice * arrSummedQtyCombinations[key];
                } else {
                  return 0;
                }
              });
              

              console.log('L451', offerPriceCombination)
              // Calculate the sum of targetQuantityPrice of selected promotions
              const totalTargetQuantityPrice = offerPriceCombination.reduce((acc, current) => acc + current, 0);
              console.log('L456', totalTargetQuantityPrice)
              /** test 2 */
              price_per_product =
              totalTargetQuantityPrice / (sumOfOfferLinesQty + 1); // Price for each product

              /** we could select the first line of each grouping because it's the one merged into */
              var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                // search orderlines for lines that have products included in matched offers
                return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
              });

              linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                modifiedLine.set_unit_price(price_per_product);
              });




            } else {
              if (offersTargetQty.some(value => (sumOfOfferLinesQty + 1) % value === 0)) {
                console.log('L875: lines qty is a multiplier of offer targetQty but no merge')
                // Find all values in the array that divide (sumOfOfferLinesQty + 1) without a remainder
                const divisibleValues = offersTargetQty.filter(value => (sumOfOfferLinesQty + 1) % value === 0);

                // Check if more than one value divides (sumOfOfferLinesQty + 1)
                if (divisibleValues.length > 1) {
                  // Choose the offer with greatest number of products
                  const greatestOfferQty = Math.max(...divisibleValues);


                  // Step 2.1: add the created line
                  this.add_orderline(line);

                  this.select_orderline(this.get_last_orderline());
                  // Step 2.2: merge separate lines of other products in the summed offers
                  for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                    console.log('L521', linesProductIdGrouping, line.get_product().id)
                    // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                    if (linesProductIdGrouping !== line.get_product().id.toString()) { // test 1
                        // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                          console.log('L525', linesProductIdGrouping)
                          // start from second line to be merged
                          linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                          this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                        // }
                    
                    }
                  }

                  

                  // Step 2.3: Apply offer price

                  // select the targetQtyPrice
                  const selectedTargetQuantityPrice = matchedOffersArray.find(item => item.targetQuantity === greatestOfferQty).targetQuantityPrice;
                  const selectedTargetQuantityMultiplier =  (sumOfOfferLinesQty + 1) / greatestOfferQty // test 1
                  
                  price_per_product = // test 2
                  (selectedTargetQuantityPrice * selectedTargetQuantityMultiplier) / (sumOfOfferLinesQty + 1); // Price for each product

                  /** we could select the first line of each grouping because it's the one merged into */
                  var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                    // search orderlines for lines that have products included in matched offers
                    return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
                  });

                  linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                    modifiedLine.set_unit_price(price_per_product);


              });

                } else {
                  console.log('L926: lines qty is offer targetQty plus one but no merge')
                  // lines qty is exactly one of the offers qty
                  // Choose the offer with greatest number of products (actually it's one product but the same logic can still be applied)
                  const greatestOfferQty = Math.max(...divisibleValues);


                  // Step 2.1: add the created line
                  this.add_orderline(line);

                  this.select_orderline(this.get_last_orderline());
                  // Step 2.2: merge separate lines of other products in the summed offers
                  for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                    console.log('L521', linesProductIdGrouping, line.get_product().id)
                    // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                    if (linesProductIdGrouping !== line.get_product().id.toString()) { // test 1
                        // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                          console.log('L525', linesProductIdGrouping)
                          // start from second line to be merged
                          linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                          this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                        // }
                    
                    }
                  }

                  

                  // Step 2.3: Apply offer price

                  // select the targetQtyPrice
                  const selectedTargetQuantityPrice = matchedOffersArray.find(item => item.targetQuantity === greatestOfferQty).targetQuantityPrice;
                  
                  price_per_product =
                  selectedTargetQuantityPrice / (sumOfOfferLinesQty + 1); // Price for each product

                  /** we could select the first line of each grouping because it's the one merged into */
                  var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                    // search orderlines for lines that have products included in matched offers
                    return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
                  });

                  linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                    modifiedLine.set_unit_price(price_per_product);


                  });

                }

              } else {
                // lines qty is not a multiplier of any offer
                var smallestOfferQty = Math.min(...offersTargetQty)
                if ((sumOfOfferLinesQty + 1) > smallestOfferQty) {
                  // if (offersTargetQty.some(value => (sumOfOfferLinesQty) % value === 0)) { // test 1
                  if (firstLineOfSameProduct === lastLineOfSameProduct) {
                    // quick workaround to check if present lines qty is a multiplier of an offer qty i.e. added line is a plus one
                    // then add the new line leaving the lines with offer applied

                    this.add_orderline(line);

                    this.select_orderline(this.get_last_orderline());
                  } else {
                    this.add_orderline(line);

                    this.select_orderline(this.get_last_orderline());
                  }
                } else {
                  // lines qty didn't reach the smallest qty of offers
                    this.add_orderline(line);

                    this.select_orderline(this.get_last_orderline());
                  
                }

              }
            }
          } else {
            // product is found in one offer only
            
            if (offersTargetQty.some(value => (sumOfOfferLinesQty + 1) % value === 0)) {
              // Find all values in the array that divide (sumOfOfferLinesQty + 1) without a remainder
              const divisibleValues = offersTargetQty.filter(value => (sumOfOfferLinesQty + 1) % value === 0);

                // lines qty is exactly one of the offers qty
                // Choose the offer with greatest number of products (actually it's one product but the same logic can still be applied)
                const greatestOfferQty = Math.max(...divisibleValues);


                // Step 2.1: add the created line
                    this.add_orderline(line);

                    this.select_orderline(this.get_last_orderline());
                // Step 2.2: merge separate lines of other products in the summed offers
                for (const linesProductIdGrouping in linesOfSameProductsGroupedByProductId) {
                  console.log('L521', linesProductIdGrouping, line.get_product().id)
                  // if (!linesOfSameProductsGroupedByProductId[line.get_product().id]) { // Check if the linesProductIdGrouping is a direct property
                  if (linesProductIdGrouping !== line.get_product().id.toString()) { // test 1
                      // for (let i = 1; i < linesOfSameProductsGroupedByProductId[linesProductIdGrouping].length; i++) {
                        console.log('L525', linesProductIdGrouping)
                        // start from second line to be merged
                        linesOfSameProductsGroupedByProductId[linesProductIdGrouping][0].merge(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1])
                        this._unlinkOrderline(linesOfSameProductsGroupedByProductId[linesProductIdGrouping][1]);
                      // }
                  
                  }
                }

                

                // Step 2.3: Apply offer price

                // select the targetQtyPrice
                const selectedTargetQuantityPrice = matchedOffersArray.find(item => item.targetQuantity === greatestOfferQty).targetQuantityPrice;
                
                price_per_product =
                selectedTargetQuantityPrice / (sumOfOfferLinesQty + 1); // Price for each product

                /** we could select the first line of each grouping because it's the one merged into */
                var linesOfProductIncludedInMultipleOffersAfterModification = this.orderlines.filter(orderline => {
                  // search orderlines for lines that have products included in matched offers
                  return matchedOffersArray.some(offer => offer.includedProductIds.includes(orderline.get_product().id));
                });

                linesOfProductIncludedInMultipleOffersAfterModification.forEach(function (modifiedLine) {
                  modifiedLine.set_unit_price(price_per_product);


                });

              

            } else {
              // added line is in single offer and line qty is not a multiplier
              console.log("L1056: lines qty is not a multiplier of offer targetQty but there's an offer no merge")

              var smallestOfferQty = Math.min(...offersTargetQty)
              if ((sumOfOfferLinesQty + 1) > smallestOfferQty) {
                if (offersTargetQty.some(value => (sumOfOfferLinesQty) % value === 0)) {
                  // quick workaround to check if present lines qty is a multiplier of an offer qty i.e. added line is a plus one
                  // then add the new line leaving the lines with offer applied
                    this.add_orderline(line);

                    this.select_orderline(this.get_last_orderline());
                }
              } else {
                // lines qty didn't reach the smallest qty of offers
                    this.add_orderline(line);

                    this.select_orderline(this.get_last_orderline());
                
              }

            }
          }
        } else {
          // not included in any offer

          this.add_orderline(line);

          this.select_orderline(this.get_last_orderline());
        }
        // **********





        this.add_orderline(line);

        this.select_orderline(this.get_last_orderline());
      }

















      //   if (matchedOfferObject) {
      //     matchedTargetQuantity = matchedOfferObject['targetQuantity'];
      //     matchedTargetQuantityPrice = matchedOfferObject['targetQuantityPrice'];
      //     matchedRuleId = matchedOfferObject['ruleId'];
      //     matchedRewardId = matchedOfferObject['rewardId'];
        
      //     /** start a logic validation to check if matchedLinesGroupedByOfferQuantityAndPrice
      //      * contains an object which has an object with same matchedRuleId, same matchedRewardId. **/
      //     if (matchedLinesGroupedByOfferQuantityAndPrice.length !== 0) {
      //       /** if we have already an object with same offer details,
      //        * we should check if we have same rule_id and reward_id **/
      //       const offerGroupindex = matchedLinesGroupedByOfferQuantityAndPrice.findIndex(group => group.ruleId === matchedRuleId && group.rewardId === matchedRewardId);
      //       if (offerGroupindex === -1) {
      //         matchedLinesGroupedByOfferQuantityAndPrice.push({
      //           matchedOrderlines: [orderline],
      //           ruleId: matchedRuleId,
      //           rewardId: matchedRewardId,
      //           targetQuantity: matchedTargetQuantity,
      //           targetQuantityPrice: matchedTargetQuantityPrice
      //         });
      //       } else {
      //         matchedLinesGroupedByOfferQuantityAndPrice[offerGroupindex].matchedOrderlines.push(orderline);
      //       }

      //     } else {
      //       matchedLinesGroupedByOfferQuantityAndPrice.push({
      //       matchedOrderlines: [orderline],
      //       ruleId: matchedRuleId,
      //       rewardId: matchedRewardId,
      //       targetQuantity: matchedTargetQuantity,
      //       targetQuantityPrice: matchedTargetQuantityPrice

      //       })
      //     }

          
      //   } else {
      //     console.log(`No offer was found for this orderline`);
      //   }
      //   // if ('multipleOfferInCommonProduct' in offerGroupedByrepetition[0]) {
      //   //   // if there are offers with products in common and no outlier 
          
      //   // } else if ('singleOfferNotInCommonProduct' in offerGroupedByrepetition[0] && 'multipleOfferInCommonProduct' in offerGroupedByrepetition[1]) {

      //   // } else if ('singleOfferNotInCommonProduct' in offerGroupedByrepetition[0]) {
      //   //   // only not in common products

      //   // } else {
      //   //   // no offer is found
      //   // }
      // // }
      // console.log('L397', matchedLinesGroupedByOfferQuantityAndPrice);
      // // TODO start logic of removing, merging and offer price application
      // /** we know that if the condition to_merge_orderline is true, one is firm that there's an orderline with this product 
      //  * we loop through the matchedOrderlines of each matchedLines object to find if added line
      //  * contains a product associated with an offer
      //  * then if found, we figure out the sum of qty of lines in the same offer group
      //  * then if it and the added line qty equals to targetQuantity or its multipliers
      //  * then merge the added line to the current line of the same product and apply offer price to lines of offer products
      //  * else if sum is different than targetQuantity or its multipliers
      //  * then one should check if the sum of current offer lines and the added line qty greater than targetQuantity
      //  * then if added line qty is 1 plus already existing offer
      //  * then add the line with with regular price
      //  * else if added line is added to line with regular price and offer
      //  * then merge the added line to the last line of the same product and DON'T apply offer price to merged line
      //  * else i.e. less than targetQuantity
      //  * then merge the new line with existing line with regular pricing **/
      // var matchedGroupsOfLines = matchedLinesGroupedByOfferQuantityAndPrice.filter(obj => obj.matchedOrderlines.filter(matchLine => matchLine.product_tmpl_id === line.product.product_tmpl_id));
      // console.log('L414', matchedGroupsOfLines);
      // if (matchedGroupsOfLines) {
      //   if (matchedGroupsOfLines.length === 1) {
      //     console.log('L417', matchedGroupsOfLines);
      //     const sumOfGroupLinesQty = matchedGroupsOfLines.reduce((accumulator, currentValue) => {
      //       return accumulator + currentValue.matchedOrderlines.reduce((acc, current) => acc + current.quantity, 0);
      //     }, 0);
      //     console.log('L419', sumOfGroupLinesQty);

      //     var offerUnitPrice = matchedGroupsOfLines[0].targetQuantityPrice / (sumOfGroupLinesQty + 1); // Price for each product is 100 / 4
      //     const linesOfSameProduct = [];
      //     // we must use forEach to 'scan' orderlines because user might add lines with same product in different places
      //     matchedGroupsOfLines.forEach(group => {
      //       group.matchedOrderlines.forEach(matchLine => {
      //         if (matchLine.product.product_tmpl_id === line.product.product_tmpl_id) {
      //         console.log('L426', group, line)
      //         linesOfSameProduct.push(group);
      //         }
      //       })
      //     })
      //       if (to_merge_orderline) {
      //         if ((sumOfGroupLinesQty + 1) % matchedGroupsOfLines[0].targetQuantity === 0) {
      //           // sum of one offer group is equal to offer qunatity or its multiplier
      //           if (linesOfSameProduct.length > 1) {
      //             /** if the selectedLine has another separate line and an offer can be applied then
      //              * we clean up and apply the offer**/


      //             var firstLineOfSameProduct = presentLinesOfSameProduct[0];

      //             var lastLineOfSameProduct = presentLinesOfSameProduct.at(-1);
      
      //             this._unlinkOrderline(lastLineOfSameProduct);
      
      //             firstLineOfSameProduct.merge(lastLineOfSameProduct);
      
      //             firstLineOfSameProduct.merge(line);
      
      //             // cleanup for every item included in the offer but on separate lines
      
      //             // if (hasDuplicateOfferProductIds) {
      //             //   for (let i = 0; i < this.orderlines.length; i++) {
      //             //     const index = this.orderlines.findIndex(
      //             //       (element, index) =>
      //             //         index > i &&
      //             //         element.product.id === this.orderlines[i].product.id
      //             //     );
      
      //             //     if (index !== -1) {
      //             //       this.orderlines[i].merge(this.orderlines[index]);
      
      //             //       this._unlinkOrderline(this.orderlines[index]);
      //             //     }
      //             //   }
      //             // }
      
      //             // firstLineOfSameProduct.set_quantity(toBeMergedQuantity, false)
      
      //             this.select_orderline(firstLineOfSameProduct);

      //           } else {
      //             // no line contain the same product in same offer group i.e. no separate line of same product
      //             // TODO Investigate why price doesn't change
      //             matchedGroupsOfLines.forEach(group => {
      //               group.matchedOrderlines.forEach(matchLine => {
      //                 console.log('L366', line)
      //                 // to_merge_orderline.merge(line);
      //                 line.set_unit_price(offerUnitPrice);
      //                 this.select_orderline(to_merge_orderline);
      //               })
      //             })

      //           }
      //         }
                
              
      //             to_merge_orderline.merge(line);
      //             this.select_orderline(to_merge_orderline);
      //         } else {
      //             this.add_orderline(line);
      //             this.select_orderline(this.get_last_orderline());
      //         }
      //     } else if (matchedGroupsOfLines.length > 1) {
      //       // added line contains a product that is found in multiple offer
      //       const sumOfGroupsLinesQty = matchedGroupsOfLines.reduce((accumulator, currentValue) => {
      //         return accumulator + currentValue.matchedOrderlines.reduce((acc, current) => acc + current.quantity, 0);
      //       }, 0); // this will equal to sum of qty of lines multiplied by number of offers which includes the product of added line 
      //       console.log('L492', sumOfGroupsLinesQty);
      //       const sumOfOneGroupQty = sumOfGroupsLinesQty / sumOfGroupsLinesQty.length
      //       var productTargetQuantityWithOfferPrice = Object.fromEntries(matchedGroupsOfLines.map((element) => [element.targetQuantity, element.targetQuantityPrice]));
      //       switch (true) {
      //         // ordered quantity of products that are included in the offer, is either equal to max or min or any designated quantity in between
        
      //         case sumOfOneGroupQty in productTargetQuantityWithOfferPrice:
      //           total_price = targetQuantityWithOfferPrice[sumOfOneGroupQty];
        
      //           price_per_product = total_price / sumOfOneGroupQty; // Price for each product is 100 / 4
        
      //           customProductLines.forEach(function (line) {
      //             line.set_unit_price(price_per_product);
      //           });
        
      //           break;
        
      //         // ordered quantity of products that are included in the offer, is greater than min but lesser than max
        
      //         case sumOfOneGroupQty > minimumOfferQuantity &&
      //           sumOfOneGroupQty < maximumOfferQuantity:
      //           total_price = minimumOfferPrice;
        
      //           price_per_product =
      //             total_price / (sumOfOneGroupQty - addedOrderline.quantity); // Price for each product is 100 / 4
        
      //           var toBeModifiedLines = customProductLines.filter(
      //             (obj) => !(obj.id === addedOrderline.id)
      //           );
        
      //           toBeModifiedLines.forEach(function (line) {
      //             line.set_unit_price(price_per_product);
      //           });
        
      //           break;
        
      //         // ordered quantity of products that are included in the offer, is greater than max
        
      //         case sumOfOneGroupQty > maximumOfferQuantity:
      //           switch (true) {
      //             case (sumOfOneGroupQty % minimumOfferQuantity === 0 &&
      //               sumOfOneGroupQty % maximumOfferQuantity === 0) ||
      //               sumOfOneGroupQty % maximumOfferQuantity === 0:
      //               // 12, 24, 48, etc
        
      //               multiplier = sumOfOneGroupQty / maximumOfferQuantity;
        
      //               total_price = maximumOfferPrice * multiplier;
        
      //               break;
        
      //             case sumOfOneGroupQty % minimumOfferQuantity === 0:
      //               // 8, 16, 32, etc
        
      //               multiplier = sumOfOneGroupQty / minimumOfferQuantity;
        
      //               total_price = minimumOfferPrice * multiplier;
        
      //               break;
        
      //             default:
        
      //             // 6 + 1, 8 + 1, 9 + 1, 10 + 1
        
      //             // let nearestFactor = sumOfOneGroupQty - 1;
        
      //             // let maximumOrMinimumDecision = maximumOfferQuantity
        
      //             // while (nearestFactor > 0) {
        
      //             // if (nearestFactor % maximumOfferQuantity === 0) {
        
      //             //     break;
        
      //             // } else if (nearestFactor % minimumOfferQuantity === 0) {
        
      //             //     maximumOrMinimumDecision = minimumOfferQuantity
        
      //             //     break;
        
      //             // }
        
      //             // nearestFactor--;
        
      //             // }
        
      //             // let factorDifference = sumOfOneGroupQty - nearestFactor;
        
      //             // // retrieve all lines that have products in the offer, that quantity of lines of same product of added product
        
      //             // let index = customProductLines.findIndex(obj => obj.id === addedOrderline.id);
        
      //             // if (index !== -1) {
        
      //             //     customProductLines.splice(index, 1);
        
      //             // }
        
      //             // multiplier = nearestFactor / maximumOrMinimumDecision
        
      //             // total_price = (targetQuantityWithOfferPrice[maximumOrMinimumDecision] * multiplier) + (line.get_product().lst_price * factorDifference);
      //           }
        
      //           // total_price = targetQuantityWithOfferPrice[Math.max(...targetQuantityArray)] + line.get_product().lst_price;
        
      //           if (total_price) {
      //             price_per_product = total_price / sumOfOneGroupQty; // Price for each product is 100 / 4
        
      //             customProductLines.forEach(function (line) {
      //               line.set_unit_price(price_per_product);
      //             });
      //           }
        
      //           break;
        
      //         default:
      //           customProductLines.forEach(function (line) {
      //             line.set_unit_price(line.get_product().lst_price);
      //           });
      //       }
      //       var offerUnitPrice = matchedGroupsOfLines.targetQuantityPrice / sumOfGroupLinesQty; // Price for each product is 100 / 4
      //       const linesOfSameProduct = [];
      //       this.add_orderline(line);
      //       this.select_orderline(this.get_last_orderline());
      //     } else {
      //       if (to_merge_orderline) {
      //         to_merge_orderline.merge(line);
      //         this.select_orderline(to_merge_orderline);
      //     } else {
      //         this.add_orderline(line);
      //         this.select_orderline(this.get_last_orderline());
      //     }
      //     }
      //   } else {
      //     if (to_merge_orderline) {
      //       to_merge_orderline.merge(line);
      //       this.select_orderline(to_merge_orderline);
      //   } else {
      //       this.add_orderline(line);
      //       this.select_orderline(this.get_last_orderline());
      //   }
      //   }



      // if (to_merge_orderline) {
      //   if ((sumOfGroupLinesQty + 1) % matchedGroupsOfLines.targetQuantity === 0) {
      //     // sum of one offer group is equal to offer qunatity or its multiplier
          
      //   } else if () {
      //       to_merge_orderline.merge(line);
      //       this.select_orderline(to_merge_orderline);
      //   } else {
      //       this.add_orderline(line);
      //       this.select_orderline(this.get_last_orderline());
      //   }



    // ends the offer block

    // if (to_merge_orderline) {
    //   if (includedProductUniqueIdsInAllRules.includes(line.get_product().id)) {
    //     if (
    //       targetQuantityArray.some(
    //         (num) => (totalCustomProducts + line.quantity) % num === 0
    //       )
    //     ) {
    //       if (presentLinesOfSameProduct.length > 1) {
    //         // in case of 5 + 1 new prepared line = 4 + 1 + 1 new prepared line, 7 + 1 = 6 + 1 + 1 new prepared line, etc

    //         // we should not add the prepared line, remove the present second line, and add the quantities of prepared and removed lines to firrst present line

    //         var firstLineOfSameProduct = presentLinesOfSameProduct[0];

    //         var lastLineOfSameProduct = presentLinesOfSameProduct.at(-1);

    //         this._unlinkOrderline(lastLineOfSameProduct);

    //         firstLineOfSameProduct.merge(lastLineOfSameProduct);

    //         firstLineOfSameProduct.merge(line);

    //         // cleanup for every item included in the offer but on separate lines

    //         if (hasDuplicateOfferProductIds) {
    //           for (let i = 0; i < this.orderlines.length; i++) {
    //             const index = this.orderlines.findIndex(
    //               (element, index) =>
    //                 index > i &&
    //                 element.product.id === this.orderlines[i].product.id
    //             );

    //             if (index !== -1) {
    //               this.orderlines[i].merge(this.orderlines[index]);

    //               this._unlinkOrderline(this.orderlines[index]);
    //             }
    //           }
    //         }

    //         // firstLineOfSameProduct.set_quantity(toBeMergedQuantity, false)

    //         this.select_orderline(firstLineOfSameProduct);
    //       } else {
    //         // we should have a second line for the products with original price per unit

    //         // in case of 1 + 1 new prepared line

    //         to_merge_orderline.merge(line);

    //         this.select_orderline(to_merge_orderline);

    //         // cleanup for every item included in the offer but on separate lines

    //         if (hasDuplicateOfferProductIds) {
    //           for (let i = 0; i < this.orderlines.length; i++) {
    //             const index = this.orderlines.findIndex(
    //               (element, index) =>
    //                 index > i &&
    //                 element.product.id === this.orderlines[i].product.id
    //             );

    //             if (index !== -1) {
    //               this.orderlines[i].merge(this.orderlines[index]);

    //               this._unlinkOrderline(this.orderlines[index]);
    //             }
    //           }
    //         }
    //       }
    //     } else {
    //       if (
    //         toBeMergedQuantity < minimumOfferQuantity &&
    //         totalCustomProducts < minimumOfferQuantity
    //       ) {
    //         to_merge_orderline.merge(line);

    //         this.select_orderline(to_merge_orderline);
    //       }

    //       // in case of 4 + 1, 6 + 1, 8 + 1, 9 + 1 etc.
    //       else if (presentLinesOfSameProduct.length > 1) {
    //         // in case of 9 + 1 = 8 + 2 = 8 + 1 + 1 new prepared line

    //         var lastLineOfSameProduct = presentLinesOfSameProduct.at(-1);

    //         lastLineOfSameProduct.merge(line);

    //         this.select_orderline(lastLineOfSameProduct);
    //       } else {
    //         // in case of 4 + 1 new prepared line (verified)

    //         this.add_orderline(line);

    //         this.select_orderline(this.get_last_orderline());
    //       }
    //     }
    //   } else {
    //     to_merge_orderline.merge(line);

    //     this.select_orderline(to_merge_orderline);
    //   }

    //   // to_merge_orderline.merge(line);

    //   // this.select_orderline(to_merge_orderline);
    // } else {
    //   this.add_orderline(line);

    //   this.select_orderline(this.get_last_orderline());
    // }

    if (options.draftPackLotLines) {
      this.selected_orderline.setPackLotLines({
        ...options.draftPackLotLines,
        setQuantity: options.quantity === undefined,
      });
    }

    if (options.comboLines?.length) {
      await this.addComboLines(line, options);

      // Make sure the combo parent is selected.

      this.select_orderline(line);
    }

    // this.apply_custom_price(line);
  },

  apply_custom_price: function (addedOrderline) {
    var orderlines = this.get_orderlines();

    var includedProductUniqueIdsInAllRules = Array.from(
      new Set(orderlines[0].offerArray.flatMap((obj) => obj.includedProductIds))
    );

    var targetQuantityWithOfferPrice = orderlines[0].offerArray.reduce(
      (acc, obj) => {
        acc[obj.targetQuantity] = obj.targetQuantityPrice;

        return acc;
      },
      {}
    );

    var totalCustomProducts = 0;

    var customProductLines = [];

    var presentLinesOfSameProduct = [];

    var sumOfQuantitiesOfLinesOfSameProduct = 0;

    // Calculate how many of the custom-priced products are in the cart

    for (var line of orderlines) {
      var productId = line.get_product().id;

      if (includedProductUniqueIdsInAllRules.includes(productId)) {
        totalCustomProducts += line.get_quantity();

        customProductLines.push(line);
      }

      if (addedOrderline.product.id === productId) {
        sumOfQuantitiesOfLinesOfSameProduct += addedOrderline.get_quantity();

        presentLinesOfSameProduct.push(addedOrderline);
      }
    }

    var total_price;

    var price_per_product;

    var targetQuantityArray = [...Object.keys(targetQuantityWithOfferPrice)];

    var minimumOfferQuantity = Math.min(...targetQuantityArray);

    var maximumOfferQuantity = Math.max(...targetQuantityArray);

    var minimumOfferPrice = targetQuantityWithOfferPrice[minimumOfferQuantity];

    var maximumOfferPrice = targetQuantityWithOfferPrice[maximumOfferQuantity];

    var multiplier;

    var firstLineOfSameProduct = presentLinesOfSameProduct[0];

    var lastLineOfSameProduct = presentLinesOfSameProduct.at(-1);

    // Apply custom price logic if total custom-priced products equal 4

    switch (true) {
      // ordered quantity of products that are included in the offer, is either equal to max or min or any designated quantity in between

      case totalCustomProducts in targetQuantityWithOfferPrice:
        total_price = targetQuantityWithOfferPrice[totalCustomProducts];

        price_per_product = total_price / totalCustomProducts; // Price for each product is 100 / 4

        customProductLines.forEach(function (line) {
          line.set_unit_price(price_per_product);
        });

        break;

      // ordered quantity of products that are included in the offer, is greater than min but lesser than max

      case totalCustomProducts > minimumOfferQuantity &&
        totalCustomProducts < maximumOfferQuantity:
        total_price = minimumOfferPrice;

        price_per_product =
          total_price / (totalCustomProducts - addedOrderline.quantity); // Price for each product is 100 / 4

        var toBeModifiedLines = customProductLines.filter(
          (obj) => !(obj.id === addedOrderline.id)
        );

        toBeModifiedLines.forEach(function (line) {
          line.set_unit_price(price_per_product);
        });

        break;

      // ordered quantity of products that are included in the offer, is greater than max

      case totalCustomProducts > maximumOfferQuantity:
        switch (true) {
          case (totalCustomProducts % minimumOfferQuantity === 0 &&
            totalCustomProducts % maximumOfferQuantity === 0) ||
            totalCustomProducts % maximumOfferQuantity === 0:
            // 12, 24, 48, etc

            multiplier = totalCustomProducts / maximumOfferQuantity;

            total_price = maximumOfferPrice * multiplier;

            break;

          case totalCustomProducts % minimumOfferQuantity === 0:
            // 8, 16, 32, etc

            multiplier = totalCustomProducts / minimumOfferQuantity;

            total_price = minimumOfferPrice * multiplier;

            break;

          default:

          // 6 + 1, 8 + 1, 9 + 1, 10 + 1

          // let nearestFactor = totalCustomProducts - 1;

          // let maximumOrMinimumDecision = maximumOfferQuantity

          // while (nearestFactor > 0) {

          // if (nearestFactor % maximumOfferQuantity === 0) {

          //     break;

          // } else if (nearestFactor % minimumOfferQuantity === 0) {

          //     maximumOrMinimumDecision = minimumOfferQuantity

          //     break;

          // }

          // nearestFactor--;

          // }

          // let factorDifference = totalCustomProducts - nearestFactor;

          // // retrieve all lines that have products in the offer, that quantity of lines of same product of added product

          // let index = customProductLines.findIndex(obj => obj.id === addedOrderline.id);

          // if (index !== -1) {

          //     customProductLines.splice(index, 1);

          // }

          // multiplier = nearestFactor / maximumOrMinimumDecision

          // total_price = (targetQuantityWithOfferPrice[maximumOrMinimumDecision] * multiplier) + (line.get_product().lst_price * factorDifference);
        }

        // total_price = targetQuantityWithOfferPrice[Math.max(...targetQuantityArray)] + line.get_product().lst_price;

        if (total_price) {
          price_per_product = total_price / totalCustomProducts; // Price for each product is 100 / 4

          customProductLines.forEach(function (line) {
            line.set_unit_price(price_per_product);
          });
        }

        break;

      default:
        customProductLines.forEach(function (line) {
          line.set_unit_price(line.get_product().lst_price);
        });
    }
  },
});
