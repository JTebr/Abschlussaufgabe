/**
*@author Anika Graupner: 437401
*@author Cornelia Zygar: 437451
*@desc function to resize the columns
*see: https://codepen.io/xmaster/pen/swJBe
*/

"use strict";

$(function () 
{
    $(".resizable1").resizable( //JQuery UI resizable
    {
        autoHide: true,
        handles: 'e',
        resize: function(e, ui) 
        {
            var parent = ui.element.parent();
            //alert(parent.attr('class'));
            var remainingSpace = parent.width() - ui.element.outerWidth(),
                divTwo = ui.element.next(),
                divTwoWidth = (remainingSpace - (divTwo.outerWidth() - divTwo.width()))/parent.width()*100+"%";
                divTwo.width(divTwoWidth);
        },
        stop: function(e, ui) 
        {
            var parent = ui.element.parent();
            ui.element.css(
            {
                width: ui.element.width()/parent.width()*100+"%",
            });
        }
    });
});

