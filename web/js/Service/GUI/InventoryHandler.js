/**
 * InventoryHandler Service
 *
 * Manage a/the Players inventory
 *  - handle equipping and unequipping Items (drag and drop)
 *  - inventory style grid/list ?
 *  - different types of equipment slots?
 *  - Get Items
 *  - Remove Items
 *  - load items to Inventory
 */

Hw.Service.InventoryHandler = (function(){

    var _invItemClass = '.inv-item';

    $('.inv-slot').droppable({
        accept: function (draggable) {
            if (draggable.hasClass('inv-item')) {
                if ($(this).hasClass('equip-slot')) {

                    /**
                     * Left and right hand slots can only be equipped with items of type: weapon
                     */
                    if (-1 !== ['left', 'right'].indexOf($(this).data('slot')) && 'weapon' == $(draggable).data('item').type) {
                        return true;
                    }

                    /**
                     * All the other equippable slots can hold an item with the same type. eg:
                     * armor: armor
                     * trinket: trinket
                     */
                    if ($(this).data('slot') == $(draggable).data('item').type) {
                        return true;
                    }

                    return false;
                } else {
                    if ($(this).data('slot') == $(draggable).data('item').type || $(this).hasClass('inv-slot')) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
            return false;
        },
        drop: function (event, ui) {
            var itemId = ui.draggable.data('item').id;
            var $item = $('#item-' + itemId);
            var wasInSlot = $item.parent('div').data('slot');
            var wasEquipped = $item.parent('div').hasClass('equip-slot');

            /**
             * if the slot was occupied, relocate the occupying item to the slot
             * where the dropped item is coming from (switch)
             */
            if ($.trim($(this).html()) !== '') {
                var $elementInSlot = $(this).children('div.inv-item');

                /**
                 * switch can only occur if the element to be switched fits the
                 * slot from where the item is coming
                 */
                if (wasEquipped && ui.draggable.data('item').type !== $elementInSlot.data('item').type) {
                    ui.draggable.draggable('option', 'revert', true);
                    Materialize.toast('I can\'t put that there.', 1500);
                    return false;
                } else {
                    $elementInSlot.appendTo($item.parent('div'));
                }
            }

            /**
             * relocates the DOM element
             */
            ui.draggable
                .css({
                    top: 0,
                    left: 0
                })
                .appendTo($(this));

            /**
             * TODO find a better way to manage items in the memory map?.
             */
            var nowInSlot = $item.parent('div').data('slot');
            _adjustInventoryMap(wasInSlot, nowInSlot);

            var isEquipped = $item.parent('div').hasClass('equip-slot');

            /**
             * If it was not equipped and now it is, or
             * if it was equipped and not it isn't, then
             *  - equipped items stats should be recalculated
             */
            if ((!wasEquipped && isEquipped) || (wasEquipped && !isEquipped)) {
                var equippedItems = {
                    hat: _inventoryMap.hat,
                    armor: _inventoryMap.armor,
                    trinket: _inventoryMap.trinket,
                    left: _inventoryMap.left,
                    right: _inventoryMap.right
                };

                $.publish('/inventory/equippedItems/change', equippedItems);
            }
        }
    });

    var $_equippedInventory = $('#equipped-inventory');
    var $_inventory = $('#inventory');
    var _slotNames = ['hat', 'armor', 'trinket', 'left', 'right'];
    var _inventoryMap =
        {
            hat: null,
            armor: null,
            trinket: null,
            left: null,
            right: null,
             0: null,  1: null,  2: null,  3: null,  4: null,
             5: null,  6: null,  7: null,  8: null,  9: null,
            10: null, 11: null, 12: null, 13: null, 14: null
        };

    /**
     * Setup the Players inventory based on a saved snapshot
     *
     * @param {{Array}} items
     *   items[0] => {equipped items}
     *   items[1] => [rest of the inventory]
     */
    var setupInventory = function (items) {
        // console.log('Setting up the inventory with Items: ', items);

        $.each(items, function (slot, item) {
            if (_inventoryMap.hasOwnProperty(slot)) {
                _inventoryMap[slot] = item;
            }
        });

        var equippedItems = {
            hat: _inventoryMap.hat,
            armor: _inventoryMap.armor,
            trinket: _inventoryMap.trinket,
            left: _inventoryMap.left,
            right: _inventoryMap.right
        };
        $.publish('/inventory/equippedItems/change', equippedItems);

        _updateInventoryHtml();
    };

    var _updateInventoryHtml = function () {
        $.each(_inventoryMap, function(slot, item){
            var inventoryToPut = $_inventory;
            if (-1 !== _slotNames.indexOf(slot)) {
                inventoryToPut = $_equippedInventory;
            }

            if (item != null) {
                inventoryToPut.find("[data-slot='" + slot + "']").html(item.getItemHtml());
            } else {
                inventoryToPut.find("[data-slot='" + slot + "']").html('');
            }
        });

        $(_invItemClass).draggable({
            revert: function (isValid) {
                if (isValid) {
                    return false;
                } else {
                    Materialize.toast('I can\'t put that there.', 1500);
                    return true;
                }
            },
            revertDuration: 100
        });
    };

    /**
     * Moves an item to it's new location in the _inventoryMap based on it's physical location
     *
     * @param wasInSlot
     * @param nowInSlot
     */
    var _adjustInventoryMap = function (wasInSlot, nowInSlot) {
        var ref = _inventoryMap[wasInSlot];
        _inventoryMap[wasInSlot] = _inventoryMap[nowInSlot];
        _inventoryMap[nowInSlot] = ref;
    };

    var getInventory = function () {
        // console.log(_equippedItemsMap);
        return _inventoryMap;
    };

    return {
        setupInventory: setupInventory,
        getInventory: getInventory
    }
})();
