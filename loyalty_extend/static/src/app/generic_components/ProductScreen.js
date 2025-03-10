/** @odoo-module */



import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { Order, Orderline } from "@point_of_sale/app/store/models";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import {

    formatFloat,

    roundDecimals as round_di,

    roundPrecision as round_pr,

    floatIsZero,

} from "@web/core/utils/numbers";
import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/store/pos_store";

patch(ProductScreen.prototype, {

    // async updateSelectedOrderline({ buffer, key }) {
    //     const order = this.pos.get_order();
    //     const selectedLine = order.get_selected_orderline();
    //     // This validation must not be affected by `disallowLineQuantityChange`
    //     if (selectedLine && selectedLine.isTipLine() && this.pos.numpadMode !== "price") {
    //         /**
    //          * You can actually type numbers from your keyboard, while a popup is shown, causing
    //          * the number buffer storage to be filled up with the data typed. So we force the
    //          * clean-up of that buffer whenever we detect this illegal action.
    //          */
    //         this.numberBuffer.reset();
    //         if (key === "Backspace") {
    //             this._setValue("remove");
    //         } else {
    //             this.popup.add(ErrorPopup, {
    //                 title: _t("Cannot modify a tip"),
    //                 body: _t("Customer tips, cannot be modified directly"),
    //             });
    //         }
    //         return;
    //     }
    //     if (this.pos.numpadMode === "quantity" && selectedLine?.isPartOfCombo()) {
    //         if (key === "Backspace") {
    //             this._setValue("remove");
    //         } else {
    //             this.popup.add(ErrorPopup, {
    //                 title: _t("Invalid action"),
    //                 body: _t(
    //                     "The quantity of a combo item cannot be changed. A combo can only be deleted."
    //                 ),
    //             });
    //         }
    //         return;
    //     }
    //     if (selectedLine && this.pos.numpadMode === "quantity" && this.pos.disallowLineQuantityChange()) {
    //         const orderlines = order.orderlines;
    //         const lastId = orderlines.length !== 0 && orderlines.at(orderlines.length - 1).cid;
    //         const currentQuantity = this.pos.get_order().get_selected_orderline().get_quantity();

    //         if (selectedLine.noDecrease) {
    //             this.popup.add(ErrorPopup, {
    //                 title: _t("Invalid action"),
    //                 body: _t("You are not allowed to change this quantity"),
    //             });
    //             return;
    //         }
    //         const parsedInput = (buffer && parseFloat(buffer)) || 0;
    //         if (lastId != selectedLine.cid) {
    //             this._showDecreaseQuantityPopup();
    //         } else if (currentQuantity < parsedInput) {
    //             this._setValue(buffer);
    //         } else if (parsedInput < currentQuantity) {
    //             this._showDecreaseQuantityPopup();
    //         }
    //         return;
    //     }
    //     const val = buffer === null ? "remove" : buffer;
    //     this._setValue(val);
    //     if (val == "remove") {
    //         this.numberBuffer.reset();
    //         this.pos.numpadMode = "quantity";
    //     }
    // },

    _setValue(val) {
        const { numpadMode } = this.pos;
        const selectedLine = this.currentOrder.get_selected_orderline();
        if (selectedLine) {
            if (numpadMode === "quantity") {

                if (val === "remove") {
                  // there should be a code that provides for buy_x_with_y offer if we remove the line
                    this.currentOrder.removeOrderline(selectedLine);

                // } else if () {
                    
                    // offer logic should go here
                    // we apply same workflow for the offer; either merge lines if the offer conditionals are met and there are separate lines or no merge and just apply
                    
                } else {
                    const result = selectedLine.set_quantity(val);
                    if (!result) {
                        this.numberBuffer.reset();
                    } else {
                    // we apply same workflow for the offer; either merge lines if the offer conditionals are met and there are separate lines or no merge and just apply
                        var orderlines = this.currentOrder.get_orderlines();
                        var to_merge_orderline;

                        for (var i = 0; i < orderlines.length; i++) {
                          if (
                            orderlines.at(i).can_be_merged_with(selectedLine)
                            // && options.merge !== false
                          ) {
                            to_merge_orderline = orderlines.at(i);
                          }
                        }
                        console.log('L120', selectedLine.offerArray) // array of objects
                        // we need to check if there's any product found in multiple offer or only one
                        
                        // const result = [];

                        // const productOffers = {};
                        
                        // selectedLine.offerArray.forEach((offer) => {
                        //   offer.includedProductIds.forEach((productId) => {
                        //     if (!productOffers[productId]) {
                        //       productOffers[productId] = [];
                        //     }
                        //     productOffers[productId].push({ targetQuantity: offer.targetQuantity, targetPrice: offer.targetQuantityPrice });
                        //   });
                        // });
                        
                        // Object.keys(productOffers).forEach((productId) => {
                        //   const offerDetails = productOffers[productId];
                        //   const uniqueTargetQuantities = [...new Set(offerDetails.map((offer) => offer.targetQuantity))];
                        //   const uniqueTargetPrices = [...new Set(offerDetails.map((offer) => offer.targetPrice))];
                        
                        //   if (uniqueTargetQuantities.length > 1) {
                        //     const existingMultipleOfferProduct = result.find((item) => item.multipleOfferInCommonProduct);
                        //     if (existingMultipleOfferProduct) {
                        //       if (!existingMultipleOfferProduct.multipleOfferInCommonProduct.productId.includes(parseInt(productId))) {
                        //         existingMultipleOfferProduct.multipleOfferInCommonProduct.productId.push(parseInt(productId));
                        //       }
                        //     } else {
                        //       result.push({
                        //         multipleOfferInCommonProduct: {
                        //           targetQuantity: uniqueTargetQuantities,
                        //           targetPrice: uniqueTargetPrices,
                        //           productId: [parseInt(productId)]
                        //         }
                        //       });
                        //     }
                        //   } else {
                        //     const existingSingleOfferProduct = result.find((item) => item.singleOfferNotInCommonProduct);
                        //     if (existingSingleOfferProduct) {
                        //       if (!existingSingleOfferProduct.singleOfferNotInCommonProduct.productId.includes(parseInt(productId))) {
                        //         existingSingleOfferProduct.singleOfferNotInCommonProduct.targetQuantity.push(offerDetails[0].targetQuantity);
                        //         existingSingleOfferProduct.singleOfferNotInCommonProduct.targetPrice.push(offerDetails[0].targetPrice);
                        //         existingSingleOfferProduct.singleOfferNotInCommonProduct.productId.push(parseInt(productId));
                        //       }
                        //     } else {
                        //       result.push({
                        //         singleOfferNotInCommonProduct: {
                        //           targetQuantity: [offerDetails[0].targetQuantity],
                        //           targetPrice: [offerDetails[0].targetPrice],
                        //           productId: [parseInt(productId)]
                        //         }
                        //       });
                        //     }
                        //   }
                        // });
                        
                        // // merge multipleOfferInCommonProduct if they have same targetQuantity and targetPrice
                        // const offerGroupedByrepetition = [];
                        // result.forEach((item) => {
                        //   if (item.multipleOfferInCommonProduct) {
                        //     const existingItem = offerGroupedByrepetition.find((i) => i.multipleOfferInCommonProduct && JSON.stringify(i.multipleOfferInCommonProduct.targetQuantity) === JSON.stringify(item.multipleOfferInCommonProduct.targetQuantity) && JSON.stringify(i.multipleOfferInCommonProduct.targetPrice) === JSON.stringify(item.multipleOfferInCommonProduct.targetPrice));
                        //     if (existingItem) {
                        //       item.multipleOfferInCommonProduct.productId.forEach((id) => {
                        //         if (!existingItem.multipleOfferInCommonProduct.productId.includes(id)) {
                        //           existingItem.multipleOfferInCommonProduct.productId.push(id);
                        //         }
                        //       });
                        //     } else {
                        //       offerGroupedByrepetition.push(item);
                        //     }
                        //   } else {
                        //     offerGroupedByrepetition.push(item);
                        //   }
                        // });

                        
                        // console.log('L196', offerGroupedByrepetition);

                        
                        var includedProductUniqueIdsInAllRules = Array.from(
                            new Set(selectedLine.offerArray.flatMap((obj) => obj.includedProductIds))
                        );
                  
                        var targetQuantityWithOfferPrice = selectedLine.offerArray.reduce((acc, obj) => {
                            acc[obj.targetQuantity] = obj.targetQuantityPrice;
                  
                            return acc;
                        }, {});
                  
                      var totalCustomProducts = 0;
                  
                      var customProductLines = [];
                  
                      var presentLinesOfSameProduct = [];
                  
                      var sumOfQuantitiesOfLinesOfSameProduct = 0;
                  
                      for (var orderline of orderlines) {
                        var productId = orderline.get_product().id;
                  
                        if (includedProductUniqueIdsInAllRules.includes(productId)) {
                          totalCustomProducts += orderline.get_quantity();
                  
                          customProductLines.push(orderline);
                        }
                  
                        if (selectedLine.product.id === productId) {
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
                      selectedLine.quantity + sumOfQuantitiesOfLinesOfSameProduct;

                      
                      var matchedOfferObject = 0;
                      var matchedTargetQuantity = 0;
                      var matchedTargetQuantityPrice = 0;
                      var matchedRuleId = 0;
                      var matchedRewardId = 0;
                      var matchedLinesGroupedByOfferQuantityAndPrice = [];
                      console.log(toBeMergedQuantity)
                      // ends the offer block
                      console.log(orderlines) // each line of orderlines has updated qty after numpad hitting
                      // if (to_merge_orderline) {
                      // we need to decide if we add, merge or remove lines
                      for (var orderline of orderlines) {
                        var lineProductId = orderline.get_product().id;
                        // search inside each offer object for orderline product. if found, assign this offer object
                        matchedOfferObject = selectedLine.offerArray.find((obj) => obj.includedProductIds.includes(lineProductId));
                        console.log('L273', matchedOfferObject)
                        if (matchedOfferObject) {
                          matchedTargetQuantity = matchedOfferObject['targetQuantity'];
                          matchedTargetQuantityPrice = matchedOfferObject['targetQuantityPrice'];
                          matchedRuleId = matchedOfferObject['ruleId'];
                          matchedRewardId = matchedOfferObject['rewardId'];
                        
                          /** start a logic validation to check if matchedLinesGroupedByOfferQuantityAndPrice
                           * contains an object which has an object with same matchedRuleId, same matchedRewardId. **/
                          if (matchedLinesGroupedByOfferQuantityAndPrice.length !== 0) {
                            /** if we have already an object with same offer details,
                             * we should check if we have same rule_id and reward_id **/
                            const offerGroupindex = matchedLinesGroupedByOfferQuantityAndPrice.findIndex(group => group.ruleId === matchedRuleId && group.rewardId === matchedRewardId);
                            if (offerGroupindex === -1) {
                              matchedLinesGroupedByOfferQuantityAndPrice.push({
                                matchedOrderlines: [orderline],
                                ruleId: matchedRuleId,
                                rewardId: matchedRewardId,
                                targetQuantity: matchedTargetQuantity,
                                targetQuantityPrice: matchedTargetQuantityPrice
                              });
                            } else {
                              matchedLinesGroupedByOfferQuantityAndPrice[offerGroupindex].matchedOrderlines.push(orderline);
                            }

                          } else {
                            matchedLinesGroupedByOfferQuantityAndPrice.push({
                            matchedOrderlines: [orderline],
                            ruleId: matchedRuleId,
                            rewardId: matchedRewardId,
                            targetQuantity: matchedTargetQuantity,
                            targetQuantityPrice: matchedTargetQuantityPrice

                            })
                          }

                          
                        } else {
                          console.log(`No offer was found for this orderline`);
                        }
                        // if ('multipleOfferInCommonProduct' in offerGroupedByrepetition[0]) {
                        //   // if there are offers with products in common and no outlier 
                          
                        // } else if ('singleOfferNotInCommonProduct' in offerGroupedByrepetition[0] && 'multipleOfferInCommonProduct' in offerGroupedByrepetition[1]) {

                        // } else if ('singleOfferNotInCommonProduct' in offerGroupedByrepetition[0]) {
                        //   // only not in common products

                        // } else {
                        //   // no offer is found
                        // }
                      }
                      console.log('L325', matchedLinesGroupedByOfferQuantityAndPrice);
                      // TODO start logic of removing, merging and offer price application
                      /** we loop through the matchedOrderlines of each matchedLines object and check if it contains selectedLine
                       * then if found, we figure out the sum of qty of lines in the same offer group
                       * then if it equals to targetQuantity or its multipliers
                       * then merge all lines of the same product and apply offer price to lines of offer products
                       * else if sum is different than targetQuantity or its multipliers
                       * then split selectedLine to two lines such that one line qty complements other line/s
                       * to nearst lower offer qty, and the other line should be regularly priced **/
                      var matchedGroupOfLines = matchedLinesGroupedByOfferQuantityAndPrice.find(obj => obj.matchedOrderlines.some(line => line === selectedLine));
                      console.log('L335', matchedGroupOfLines);
                      if (matchedGroupOfLines) {
                        const sumOfGroupLinesQty = matchedGroupOfLines.matchedOrderlines.reduce((acc, obj) => acc + obj.quantity, 0);
                        console.log('L338', sumOfGroupLinesQty);

                        var offerUnitPrice = matchedGroupOfLines.targetQuantityPrice / sumOfGroupLinesQty; // Price for each product is 100 / 4
                        const linesOfSameProduct = [];
                        matchedGroupOfLines.matchedOrderlines.forEach(obj => {
                          if (obj.product.product_tmpl_id === selectedLine.product.product_tmpl_id) {
                            console.log('L346', obj, selectedLine)
                            linesOfSameProduct.push(obj);
                          }
                          console.log('L348', linesOfSameProduct)
                        });
                        if (sumOfGroupLinesQty % matchedGroupOfLines.targetQuantity === 0) {
                          // sum of one offer group is equal to offer qunatity or its multiplier
                          if (linesOfSameProduct.length > 1) {
                            /** if the selectedLine has another separate line and an offer can be applied then
                             * we clean up and apply the offer**/
                            var firstLineOfSameProduct = linesOfSameProduct[0];
                  
                            var lastLineOfSameProduct = linesOfSameProduct.at(-1);
                            this.currentOrder._unlinkOrderline(lastLineOfSameProduct);
                  
                            firstLineOfSameProduct.merge(lastLineOfSameProduct);

                            matchedGroupOfLines.matchedOrderlines.forEach(function (line) {
                              // TODO investigate when we remove the one in 4+1 combo there's an error regarding the removed line 
                              console.log('L360', line)
                              if (line.order !== null) { // workaround to avoid working with unlinked orderline that generates an error
                                line.set_unit_price(offerUnitPrice);
                              }
                              
                            });
                          } else {
                            // no line contain the same product in same offer group i.e. no separate line of same product
                            matchedGroupOfLines.matchedOrderlines.forEach(function (line) {
                              console.log('L366', line)
                              line.set_unit_price(offerUnitPrice);
                            });
                          }
                        } else if (sumOfGroupLinesQty < matchedGroupOfLines.targetQuantity) {
                          // do nothing
                          
                        } else if (sumOfGroupLinesQty > matchedGroupOfLines.targetQuantity) {

                          let nearestFactor = sumOfGroupLinesQty - 1;
                          
                          while (nearestFactor > 0) {
                            if (nearestFactor % matchedGroupOfLines.targetQuantity === 0) {
                                break;
                            }
                            nearestFactor--;
                          }
                          let factorDifference = sumOfGroupLinesQty - nearestFactor;
                          // retrieve all lines that have products in the offer, that quantity of lines of same product of added product

                          // multiplier = nearestFactor / matchedGroupOfLines.targetQuantity
                          offerUnitPrice = matchedGroupOfLines.targetQuantityPrice / nearestFactor
                          var selectedLineQty = selectedLine.get_quantity()
                          var lineQtydifferenceOfnearstFactor = selectedLineQty - factorDifference // Math.abs(nearestFactor - selectedLineQty)
                          // total_price = (matchedGroupOfLines.targetQuantityPrice * multiplier) + (line.get_product().lst_price * factorDifference);
                          // we need to decide if we are going to split selectedLine into lines or do nothing because therer're already two separate lines

                          if (linesOfSameProduct.length > 1) {
                            const regularProductPrice = selectedLine.get_product().lst_price
                            // we differentiate between the line on which does have an offer and which doesn't
                            matchedGroupOfLines.matchedOrderlines.forEach(function (line) {
                              if (line.price !== regularProductPrice && line.product.product_tmpl_id !== selectedLine.product.product_tmpl_id) {
                                console.log('L405', line)
                                line.set_unit_price(offerUnitPrice)
                              } else {
                                // the split line of the same product as selectedLine that have regular price
                                line.set_quantity(lineQtydifferenceOfnearstFactor)
                              }
                            })
                          } else {
                            matchedGroupOfLines.matchedOrderlines.forEach(function (line) {
                              if (line.product.product_tmpl_id !== selectedLine.product.product_tmpl_id) {
                                console.log('L415', line)
                                line.set_unit_price(offerUnitPrice)
                              }
                              
                              
                            });
                            // we need to split to accomodate for the offer and regular price
                            var newOrderLine = selectedLine.clone()
                            selectedLine.set_quantity(lineQtydifferenceOfnearstFactor)
                            selectedLine.set_unit_price(offerUnitPrice)
                            // add a new orderline that contains the rest of Qty of selectedLine after offer
                            this.currentOrder.add_orderline(newOrderLine);
                            newOrderLine.set_quantity(factorDifference)
                            newOrderLine.set_unit_price(selectedLine.get_product().lst_price)
                            

                          }
                        }
                      }
                      //   if (includedProductUniqueIdsInAllRules.includes(selectedLine.get_product().id)) {
                      //     if (
                      //       targetQuantityArray.some(
                      //         (num) => (totalCustomProducts + selectedLine.quantity) % num === 0
                      //       )
                      //     ) {
                      //       if (presentLinesOfSameProduct.length > 1) {
                      //         // in case of 5 + 1 new prepared line = 4 + 1 + 1 new prepared line, 7 + 1 = 6 + 1 + 1 new prepared line, etc
                  
                      //         // we should not add the prepared line, remove the present second line, and add the quantities of prepared and removed lines to firrst present line
                  
                      //         var firstLineOfSameProduct = presentLinesOfSameProduct[0];
                  
                      //         var lastLineOfSameProduct = presentLinesOfSameProduct.at(-1);
                  
                      //         this.currentOrder._unlinkOrderline(lastLineOfSameProduct);
                  
                      //         firstLineOfSameProduct.merge(lastLineOfSameProduct);
                  
                      //           //   firstLineOfSameProduct.merge(selectedLine);
                      //           console.log('L204')
                      //         // cleanup for every item included in the offer but on separate lines
                  
                      //         if (hasDuplicateOfferProductIds) {
                      //           for (let i = 0; i < orderlines.length; i++) {
                      //             const index = orderlines.findIndex(
                      //               (element, index) =>
                      //                 index > i &&
                      //                 element.product.id === orderlines[i].product.id
                      //             );
                  
                      //             if (index !== -1) {
                      //               // orderlines[i].merge(orderlines[index]);
                      //               console.log('L217')
                      //               this.currentOrder._unlinkOrderline(orderlines[index]);
                      //             }
                      //           }
                      //           console.log('L221')
                      //         }
                  
                      //         // firstLineOfSameProduct.set_quantity(toBeMergedQuantity, false)
                  
                      //         this.currentOrder.select_orderline(firstLineOfSameProduct);
                      //       } else {
                      //         // we should have a second line for the products with original price per unit
                  
                      //         // in case of 1 + 1 new prepared line
                  
                      //         // to_merge_orderline.merge(selectedLine);
                  
                      //         this.currentOrder.select_orderline(to_merge_orderline);
                  
                      //         // cleanup for every item included in the offer but on separate lines
                  
                      //         if (hasDuplicateOfferProductIds) {
                      //           for (let i = 0; i < orderlines.length; i++) {
                      //             const index = orderlines.findIndex(
                      //               (element, index) =>
                      //                 index > i &&
                      //                 element.product.id === orderlines[i].product.id
                      //             );
                  
                      //             if (index !== -1) {
                      //               orderlines[i].merge(orderlines[index]);
                      //               console.log('L248')
                      //               this.currentOrder._unlinkOrderline(orderlines[index]);
                      //             }
                      //           }
                      //         }
                      //         console.log('L253')
                      //       }
                      //     } else {
                      //       // not exactly a quantity of an offer or its multiplier
                      //       if (
                      //         toBeMergedQuantity < minimumOfferQuantity &&
                      //         totalCustomProducts < minimumOfferQuantity
                      //       ) {
                      //         to_merge_orderline.merge(selectedLine);
                  
                      //         this.currentOrder.select_orderline(to_merge_orderline);
                      //       }
                  
                      //       // in case of 4 + 1, 6 + 1, 8 + 1, 9 + 1 etc.
                      //       else if (presentLinesOfSameProduct.length > 1) {
                      //         // in case of 9 + 1 = 8 + 2 = 8 + 1 + 1 new prepared line
                  
                      //         var lastLineOfSameProduct = presentLinesOfSameProduct.at(-1);
                  
                      //         lastLineOfSameProduct.merge(selectedLine);
                      //           console.log('L272')
                      //           this.currentOrder._unlinkOrderline(selectedLine);
                      //         this.currentOrder.select_orderline(lastLineOfSameProduct);
                      //       } else {
                      //         // in case of 4 + 1 new prepared line (verified)
                      //         console.log('L278')
                      //         this.currentOrder.add_orderline(selectedLine);
                  
                      //         this.currentOrder.select_orderline(this.currentOrder.get_last_orderline());
                      //       }
                      //       console.log('L281')
                      //     }
                      //   } else {
                      //     to_merge_orderline.merge(selectedLine);
                  
                      //     this.currentOrder.select_orderline(to_merge_orderline);
                      //     console.log('L287')
                      //   }
                  
                        // to_merge_orderline.merge(line);
                  
                        // this.select_orderline(to_merge_orderline);
                      // } else {
                      //   this.currentOrder.add_orderline(selectedLine);
                  
                      //   this.currentOrder.select_orderline(this.currentOrder.get_last_orderline());
                      //   console.log('L297')
                      // }

                    }
                    // this.currentOrder.apply_custom_price(selectedLine);

                }
            } else if (numpadMode === "discount") {
                selectedLine.set_discount(val);
            } else if (numpadMode === "price") {
                selectedLine.price_type = "manual";
                selectedLine.set_unit_price(val);
            }
        }
    }
});