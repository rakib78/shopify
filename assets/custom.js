window.onload = function() { 
  
/* Social feed
=========================================== */
/*!

Name: Instagram Lite
Dependencies: jQuery
Author: Michael Lynch
Author URL: http://michaelynch.com
Date Created: January 14, 2014
Licensed under the MIT license

*/

;(function($) {

    $.fn.instagramLite = function(options) {
    
      // return if no element was bound
    // so chained events can continue
    if(!this.length) { 
      return this; 
    }

    // define default parameters
        var defaults = {
            username: null,
            clientID: null,
            limit: null,
            list: true,
            videos: false,
            urls: false,
            captions: false,
            date: false,
            likes: false,
            max_id: null,
            loadMore: null,
            error: function() {},
            success: function() {}
        }
        
        // define plugin
        self.plugin = this;

        // define settings
        self.plugin.settings = {}
 
        // merge defaults and options
        self.plugin.settings = $.extend({}, defaults, options);

        // define element
        self.el = $(this);
       
        // init
        self.loadContent();
        
        // bind load more click event
        if(plugin.settings.loadMore){
          $(plugin.settings.loadMore).on('click',function(e){
            e.preventDefault();
            self.loadContent();
          });
        } 
    },
    
    getMaxId = function(items){
    
      // return id of last item
      return items[items.length-1].id;
    },
    
    formatCaption = function(caption) {
    
      var words = caption.split(' '),
        newCaption = '';
      
      for(var i = 0; i < words.length; i++) {        
        var word;
        
        if(words[i][0] == '@') {
          var a = '<a href="http://twitter.com/'+words[i].replace('@', '').toLowerCase()+'" target="_blank">'+words[i]+'</a>';
          word = a;
        } else if(words[i][0] == '#') {
          var a = '<a href="http://twitter.com/hashtag/'+words[i].replace('#', '').toLowerCase()+'" target="_blank">'+words[i]+'</a>';
          word = a;
        } else {
          word = words[i]
        }

        newCaption += word + ' ';
        
      }
    
      return newCaption;
      
    },
    
    loadContent = function(){

      // if client ID and username were provided
      if(plugin.settings.clientID) {
      
        // for each element
        el.each(function() {
          // construct API endpoint
          var url = 'https://api.instagram.com/v1/users/self/media/recent/?access_token='+plugin.settings.clientID+'&count='+plugin.settings.limit+'&callback=?';
          
          // concat max id if max id is set
          url += (plugin.settings.max_id) ? '&max_id='+plugin.settings.max_id : '';

              $.ajax({
                type: 'GET',
                url: url,
                dataType: 'jsonp',
                success: function(data) {
                  
                  // if success status
                  if(data.meta.code === 200 && data.data.length) {
                
                    // for each piece of media returned
                    for(var i = 0; i < data.data.length; i++) {
                    
                      // define media namespace
                      var thisMedia = data.data[i],
                        item;
                      
                      // if media type is image
                      if(thisMedia.type === 'image') {
                      
                        // construct image
                        item = '<img class="il-photo__img" src="'+thisMedia.images.standard_resolution.url+'" alt="Instagram Image" data-filter="'+thisMedia.filter+'" />';

                        // if url setting is true
                        if(plugin.settings.urls) {
                          item = '<a href="'+thisMedia.link+'" target="_blank">'+item+'</a>';
                        }
                        
                        if(plugin.settings.captions || plugin.settings.date || plugin.settings.likes) {
                          item += '<div class="il-photo__meta">';
                        }
                        
                        // if caption setting is true
                        if(plugin.settings.captions && thisMedia.caption) {
                        
                          item += '<div class="il-photo__caption" data-caption-id="'+thisMedia.caption.id+'">'+self.formatCaption(thisMedia.caption.text)+'</div>';
                          
                        }
                        
                        // if date setting is true
                        if(plugin.settings.date) {
                          var date = new Date(thisMedia.created_time * 1000),
                          day = date.getDate(),
                          month = date.getMonth() + 1,
                          year = date.getFullYear(),
                          hours = date.getHours(),
                          minutes = date.getMinutes(),
                          seconds = date.getSeconds();
                          date = month +'/'+ day +'/'+ year;
                          item += '<div class="il-photo__date">'+date+'</div>';
                        }
                        
                        // if likes setting is true
                        if(plugin.settings.likes) {
                          item += '<div class="il-photo__likes">'+thisMedia.likes.count+'</div>';
                        }
                        
                        if(plugin.settings.captions || plugin.settings.date || plugin.settings.likes) {
                          item += '</div>';
                        }
                      }
                      
                      if(thisMedia.type === 'video' && plugin.settings.videos) {
                        
                        if(thisMedia.videos) {
                          var src;
                          if(thisMedia.videos.standard_resolution) {
                            src = thisMedia.videos.standard_resolution.url;
                          } else if(thisMedia.videos.low_resolution) {
                            src = thisMedia.videos.low_resolution.url;
                          } else if(thisMedia.videos.low_bandwidth) {
                            src = thisMedia.videos.low_bandwidth.url;
                          }
                          
                          item = '<video poster="'+thisMedia.images.standard_resolution.url+'" controls>';
                          item += '<source src="'+src+'" type="video/mp4;"></source>';
                          item += '</video>';
                        }
                      }
                      
                      // if list setting is true
                      if(plugin.settings.list) {
                          var item="<div class=\"insta-img\">"+item+"</div>"

                      }

                      // append image
                      el.append(item); 
                    }
                    // set new max id
                    plugin.settings.max_id = self.getMaxId(data.data);
                    // execute success callback
                    plugin.settings.success.call(this);
                  
                  } else {
                    // execute error callback
                    plugin.settings.error.call(this, data.meta.code, data.meta.error_message);
                  }
                
                },
                error: function() {
                  // recent media ajax request failed
                  // execute error callback
                  plugin.settings.error.call(this);
                }
              });
        });        
      } else {
        alert('An Instagram Access Token is required to display Instagram profile images.');
      }
    }
})(jQuery);
  
  $(function() {
    $(window).on('scroll.custom', function () {
        var height = $(window).scrollTop();

      if (height > 50) {
      var $target = $("#instafeed");
        if($target.length){  
      var clientID = $target.data('client-id');
      var limit = $target.data('count');
          
      $target.instagramLite({
        clientID: clientID,
        urls: true,
        videos: true,
        limit: limit,
        error: function(errorCode, errorMessage) {
          if(errorCode && errorMessage) {
            alert(errorCode +': '+ errorMessage);
          } 
        }
        }); 
        }
        
          
        $(window).off('scroll.custom');
        }
    });	
  }); 
  
/* Popup script 
========================================================= */ 
/* Popup script 
========================================================= */ 
$(function() {
$(document).on("click","#pop-open", function() {  
  $("#popwrap").fadeIn();
  $("body").addClass("no-scrl");

});
  
$(document).on("click","#pop-close, #popwrap", function() {   
  $("#popwrap").fadeOut();
  $("body").removeClass("no-scrl");

});

// if link contains #black-friday or #cyber-monday  
var sUrl = window.location.href;
var bF = sUrl.indexOf("#black-friday");
var sM = sUrl.indexOf("#cyber-monday");
var gM = sUrl.indexOf("#green-monday");  
if( (bF != -1) || (sM != -1) || (gM != -1) ){  
$("#pop-open").click();
}
  
// Remove link from product page
var proUrl = sUrl.indexOf("products/");
if( proUrl != -1 ){
 $("#popwrap a").attr("href", "#"); 
} 
 
// cart redirect
var sUrl = window.location.href;  
var cartUrl =  sUrl.indexOf("co/cart");
if( cartUrl != -1 ){  
$(location).attr("href", "https://www.dyln.co/products/dyln-living-alkaline-stainless-steel-water-bottle/#design"); 
}  
  
});   
  
/* Check if IOS
========================================================== */
if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
$('body').addClass('ios-device');
}else{
 $('body').addClass('no-ios'); 
}  
  
/* product page
=========================================================== */
  
/* cnange product finish */  
  $('#product-type-var.dy li').click(function(){
    
    var vtype = $(this).attr('title');
    $('select#SingleOptionSelector-0').val(vtype).trigger('change');
    
    $('#product-type-var.dy  li').removeClass('var-active');
    $(this).addClass('var-active');
  
  });
  
/* product-color-var */   
  $('#product-color-var.dy li').click(function(){
    
    var vcolor = $(this).attr('title');
    $('select#SingleOptionSelector-1').val(vcolor).trigger('change');
    
    $('#product-color-var.dy li').removeClass('var-active');
    $(this).addClass('var-active');    
  
  }); 
  
/* home design product
=========================================================== */
  
/* cnange product finish */  
  $('#product-type-var.ho li').click(function(){
    
    var vtype = $(this).attr('title');
    $('select#SingleOptionSelector-1494375224727-0').val(vtype).trigger('change');
    
    $('#product-type-var.ho  li').removeClass('var-active');
    $(this).addClass('var-active');
  
  });
  
/* product-color-var */   
  $('#product-color-var.ho li').click(function(){
    
    var vcolor = $(this).attr('title');
    $('select#SingleOptionSelector-1494375224727-1').val(vcolor).trigger('change');
    
    $('#product-color-var.ho li').removeClass('var-active');
    $(this).addClass('var-active');    
  
  });   
  
/* default product option select
========================================= */

$('.pro-option li').click(function(){
  var option = $(this).attr('title');
  var selector = $(this).parent('.pro-option').attr('option-id');
  $('select#'+selector).val(option).trigger('change');
  $('.pro-option li').removeClass('pro-option-active');
  $(this).addClass('pro-option-active'); 
});
  

 

  
function htmlEncode(value){ 
    if (value) {
        return $('<div/>').text(value).html(); 
    } else {
        return '';
    }
}  
  

  /*============================================================================
    Start of cart-related functionality
  ==============================================================================*/

  $('.cart-button').click(function(){
    $("html").addClass("slide-cart-open");
    $(".side-cart-wrapper").addClass('cart-open');
  });
  
  $('.sidecart-title, #invisible-overlay').click(function(){ 
  $("html").removeClass("slide-cart-open");  
  $(".side-cart-wrapper").removeClass('cart-open');
  });
  
$(document).on("click","#closeCart", function() {
  $("html").removeClass("slide-cart-open");  
  $(".side-cart-wrapper").removeClass('cart-open');  

});  


      
  
 
  function ajaxSubmitCart() {
    $cart = $("#cart");
    $.ajax({
      url: '/cart.js',
      dataType: 'json',
      type: 'post',
      data: $cart.serialize(),
      success: function (data) {

        refreshCart(data);        
        if($('#cart li').hasClass('cart-offer-extra')){
          //window.setTimeout(function(){ $('.cart-offer-extra').fadeOut('slow'); }, 1000);
        }
                                    
      }
    });
  }

  function refreshCart(cart) {
      $cartBtn = $(".icon-cart span");
      var cart_items_html = "";
      var $cart = $("#cart ul");
      var value = $cartBtn.text() || '0';
      $cartBtn.text(value.replace(/[0-9]+/,cart.item_count));
      var cart_count = value.replace(/[0-9]+/,cart.item_count);
    
      // testimonial show
      $(".cart-tes-content-ul li").removeClass("tes-active");
      var pos = Math.floor(Math.random() * 3) + 1; 
      $(".cart-tes-content-ul li:nth-child("+pos+")").addClass("tes-active");
     
    // cart empty check
      if( cart_count != 0){ 
      $cartBtn.removeClass('empty');
      }else{
        $cartBtn.addClass('empty');
      }
      $cart.find('li:not(:first):not(".shipping-promo")').remove();
    
if (cart.item_count == 0) {
        $cart.append('<li class="empty_cart">Your Cart is Empty <p class="empty-cart-button"><a href="/products/dyln-living-alkaline-stainless-steel-water-bottle" class="btn btn-default">Shop Now</a></p> </li>');
      } else {
                     
        var off_price =  75; 
        var off_text = "Your Order Receives Free Shipping";
        var off_price_other =  200; 
        var off_text_other = "Your Order Receives Free Shipping";                     
        var cal_price = cart.total_price / 100 ;             
                     
                                            
        if( cal_price >= off_price ){
         cart_items_html += '<li class="cart-offer-extra c-us"><span class="fa fa-check-circle"></span> '+ off_text +' </li>';            
        
        }
        if( cal_price >= off_price_other ){
         cart_items_html += '<li class="cart-offer-extra c-other"><span class="fa fa-check-circle"></span> '+ off_text_other +' </li>';            
        
        }  
  
        
        $.each(cart.items, function(index, item) {
          
          var fullTitle = item.title;
          var itemTitle = fullTitle.split('-');
          cart_items_html += '<li class="cart_item">' +
            '<p class="mm-counter">' +
              '<span class="ss-icon minus">&#x002D;</span>' +
              '<input type="text" min="0" class="quantity" name="updates[]" id="updates_' + item.id + '" value="' + item.quantity +'" />' +
              '<span class="ss-icon plus">&#x002B;</span>' +
            '</p>' +
            '<span	class="item-wrap">';
          if (item.image) {
            cart_items_html += '<div class="cart_image">' +
                '<a href="' + item.url +'"><img src="' + item.image.replace(/(\.[^.]*)$/, "_medium$1").replace('http:', '') + '" alt="' + htmlEncode(item.title) + '" /></a>' +
              '</div>';
          }
          cart_items_html += '<div class="item_title" data-url=" '+ item.url +'"><a href="' + item.url +'">' + itemTitle[0] +'</a><span> '+ itemTitle[1] +'</span></div>' +
            
              '<strong class="price">' + Shopify.formatMoney(item.price,$cart.data('money-format')) + '</strong>' +
            '</span>' +
          '</li>';
        });

        cart_items_html += '<li class="mm-label">' +
            '<p class="mm-counter">' + Shopify.formatMoney(cart.total_price,$cart.data('money-format')) + '</p>' +
            '<a href="/cart">' +
              '<strong>Subtotal</strong>' +
            '</a>' +
          '</li>' +
          '<li class="cart-bottom clearfix"><span	class="item-wrap">';

          

          
             

          cart_items_html += '<button class="btn go-cart"><i class="fa fa-lock" aria-hidden="true"></i> <span class="button-text">Checkout</span></button>' +
            '<a href="#" class="close-cart" id="closeCart">Continue Shopping</a>' +
          '</span></li>';

        $cart.append(cart_items_html);
        $cart.find('li.cart_item:last').addClass('last_cart_item');


      }    
    
  }

  $(document).on("change", "#cart input.quantity", function() { 
    ajaxSubmitCart();
  }); 
  
  $(document).on("click", "#cart .minus", function() { 
    var quantity = parseInt($(this).next("input").val()); 
	if (quantity >= 1) {
    quantity -= 1;
	}
    $(this).next("input").attr("value", quantity);
    if (quantity == 0) {
      $(this).closest('li.cart_item').addClass('animated fadeOutUp')
      setTimeout(ajaxSubmitCart, 500);
    } else {
      ajaxSubmitCart();
    }
  });
  
    
  $(document).on("click", "#cart .plus", function() { 
    var quantity = parseInt($(this).prev("input").val()); 
    quantity += 1;
    $(this).prev("input").attr("value", quantity);
    ajaxSubmitCart();
  });
    
  $(document).on("click", ".qty-m", function() { 
    var quantity = parseInt($(this).next("input").val()); 
	if (quantity > 1) {
    quantity -= 1;
	}
    $(this).next("input").val(quantity);
    
  });
    
  $(document).on("click", ".qty-p", function() { 
    var quantity = parseInt($(this).prev("input").val()); 
    quantity += 1;
    $(this).prev("input").val(quantity);
  });   
  

/* Cart page plus minus */
  $(document).on("click", ".cart__qty .minus", function() { 
    var quantity = parseInt($(this).next("input").val()); 
	if (quantity > 1) {
    quantity -= 1;
	}
    $(this).next("input").val(quantity);
    
  });
    
  $(document).on("click", ".cart__qty .plus", function() { 
    var quantity = parseInt($(this).prev("input").val()); 
    quantity += 1;
    $(this).prev("input").val(quantity);
  });   
  
    $(".product-form").submit(function(e) {
      e.preventDefault();
      var $addToCartForm = $(this);  
      var $addToCartBtn = $addToCartForm.find('.add_to_cart');
      
      $.ajax({
        url: '/cart/add.js',
        dataType: 'json',
        type: 'post',
        data: $addToCartForm.serialize(),
        beforeSend: function() {
          $addToCartBtn.attr('disabled', 'disabled').addClass('disabled');
          $addToCartBtn.find('span').removeClass("zoomIn").addClass('animated zoomOut');
        },
        success: function(itemData) {
          $addToCartBtn.find('span').text("Added").removeClass('zoomOut').addClass('fadeIn');

          window.setTimeout(function(){
            $addToCartBtn.removeAttr('disabled').removeClass('disabled');
            $addToCartBtn.find('span').addClass("fadeOut").text($addToCartBtn.data('label')).removeClass('fadeIn').removeClass("fadeOut").addClass('zoomIn');
          }, 1000);

          $.getJSON("/cart.js", function(cart) {
            refreshCart(cart);
            var sUrl = window.location.href; 
            //alert(sUrl);
            if( (sUrl == "https://www.dyln.co/#cart") || (sUrl == "https://www.dyln.co/")  ){
              $(location).attr("href", "https://www.dyln.co/products/dyln-living-alkaline-stainless-steel-water-bottle/#design")
				
            }else{
                window.setTimeout(function(){ $('.cart-button').click(); }, 500);
            }
            
          if($('#cart li').hasClass('cart-offer-extra')){
            //window.setTimeout(function(){ $('.cart-offer-extra').fadeOut('slow'); }, 1000);
          }            
            
          });    
        },
        error: function(XMLHttpRequest) {
          var response = eval('(' + XMLHttpRequest.responseText + ')');
          response = response.description;
          $('.warning').remove();

          var warning = '<p class="warning animated bounceIn">' + response.replace('All 1 ', 'All ') + '</p>';
          $addToCartBtn.after(warning);
          $addToCartBtn.removeAttr('disabled').removeClass('disabled');
          $addToCartBtn.find('span').text("Add to Cart").removeClass('zoomOut').addClass('zoomIn');
        }
      });

      return false;
    });
  
  
/* Ajax defeuser 
=========================================================== */

  // add differ ajax
  
  $(".add-diffuser-form").submit(function(e) {
  	e.preventDefault();
  	
  	
  	  var variant_id = $('#dif-id').val();
      var quantity = $('#dif-qty-cal').val();
  	data = {
      "quantity": quantity,
      "id": variant_id,
    }
    
  $.ajax({
        url: '/cart/add.js',
        dataType: 'json',
        type: 'post',
        data: data,
      beforeSend: function() {

      },
      success: function(data) {
      window.setTimeout(function(){ }, 1000);

          $.getJSON("/cart.js", function(cart) {
            refreshCart(cart);
            window.setTimeout(function(){  $('.cart-button').click(); }, 500);
          });
        var dif_title = $('#product-options li.active').attr('title');   
        $('#product-options li.active').text(dif_title);   
        $('#product-options li').removeClass('active'); 

        if($('#cart li').hasClass('cart-offer-extra')){
          //window.setTimeout(function(){ $('.cart-offer-extra').fadeOut('slow'); }, 1000);
        }        

      }

  });

  return false;
});
  
/* defuser click 
=====================================================*/
 //  Check if IE Browser 

  
    var ms_ie = false;
    var ua = window.navigator.userAgent;
    var old_ie = ua.indexOf('MSIE ');
    var new_ie = ua.indexOf('Trident/');
    var edge = ua.indexOf('Edge/');

    if ((old_ie > -1) || (new_ie > -1 || edge > -1)) {
        ms_ie = true;
    }
    



      $('#product-options li').not('.disable').click(function(){

        if($(this).hasClass('active')){
        $(this).text('Added');
        $(".add-diffuser-form").submit();     
       //alert('clicked');  
        }
        else{
        //alert('clicked');
        var dif_title = $('#product-options li.active').attr('title');   
        $('#product-options li.active').text(dif_title);   
        $('#product-options li').removeClass('active');
        $(this).addClass('active');
        
        $(this).text('ADD NOW');
          
        var c_price = $(this).attr('data-cprice');
          if(c_price === ''){
            $('p.dif-price s').addClass('hide');
            $('p.dif-price span').removeClass('on-sale');
          }
		
          if(c_price != ''){ 
            $('p.dif-price s').removeClass('hide');
            $('p.dif-price s').text(c_price);
            $('p.dif-price span').addClass('on-sale');
          }
         
        var i_price = $(this).attr('data-price');
        //var is_price = i_price.substr(0, 2);
        $('p.dif-price span').text(i_price);
        var variant_id = $(this).attr('value');
          
        $('#dif-id').val(variant_id);
        $('#df-option').val($(this).attr('title'));
        //alert('clicked');
          
        }
      
      });
  
      $('#product-options li.disable').click(function(){
        
          
          
        var dif_title = $('#product-options li.active').attr('title');   
        $('#product-options li.active').text(dif_title);   
        $('#product-options li').removeClass('active');  
        $(this).text('Sold Out');
        
        var c_price = $(this).attr('data-cprice');
		
          if(c_price != ''){ 
            $('p.dif-price s').removeClass('hide');
            $('p.dif-price s').text(c_price);
            $('p.dif-price span').addClass('on-sale');
          }


        var i_price = $(this).attr('data-price');
        //var is_price = i_price.substr(0, 2);
        $('p.dif-price span').text(i_price);
        $(this).addClass('active');
        
      
      });   
  
  
   $('#cart .item_title').each(function(){
     var fullTitle =$(this).text();
     var itemUrl = $(this).attr('data-url');
     var itemTitle = fullTitle.split('-');
     $(this).html('<a href="'+itemUrl+'" >' + itemTitle[0] + '</a> <span> '+ itemTitle[1] +'</span>');                               
   
   });  
  
  $('.open-share').click(function(){
    
    $('.share-links').slideToggle();
  
  });
  
/* Question
===================================== */
  $('.box-qe-title').click(function(){
    //alert("clicked");
    
    var avtivebox = $('.qu-box').find('.q-active').not(this).attr('data-id');
    $('.qu-box').find('.q-active').not(this).removeClass('q-active');
    $('#'+avtivebox).fadeOut('slow');
    
    var id = $(this).attr('data-id');
    
    $(this).toggleClass('q-active');
    $('#'+id).slideToggle();
    
  
  });  

       
 
  
  
  
/* mobile Menu 
====================================== */
   $("#nav-icon1").click(function(){
     $(this).toggleClass("open");         
     $("#mobile-menu-wrap").slideToggle();
   });
   
   


var $allLinks = $("#mov-nav li.is-sub");
   $allLinks.click(function(){
     $allLinks.not(this).removeClass("is-active");

       $(this).toggleClass("is-active");
     

   });
   
   
   var navHeight = $(window).height() - 60;

  $('#mobile-menu-wrap > ul').css('height', navHeight);
   $('.bgheight').css('height', navHeight);
  
$(window).on('resize', function (){
  var wHeight = $(window).height() - 60;
  $('#mobile-menu-wrap > ul').css('height', wHeight);
  $('.bgheight').css('height', wHeight);
});     
  
  
/* promo sub close */
  
  $('#close-promo').click(function(){
    
    $.cookie("preheader", "close");
    $('body').removeClass('promo-preheader');
    $('#promo').fadeOut('fast');
  
  });
  
/* smooth scroll purchase btn */

$(document).on('click', '.scl-product', function(event){
    event.preventDefault();

    $('html, body').animate({
        scrollTop: $('#PageContainer').offset().top
    }, 500);
});  
  
// Contact select change
$('select#contact-reason').on('change', function() {  
  var sVal = $(this).val();
  //alert(sVal);
 
  if(sVal == 1){
   $( location ).attr("href", "/pages/wholesale");
  }
  if(sVal == 2){
   $( location ).attr("href", "https://support.dyln.co/hc/en-us/requests/new");
  }

  if(sVal == 3){
    $('html, body').animate({
        scrollTop: $('#newsletter-section').offset().top
    }, 500);    
  }

  if(sVal == 4){
	$( location ).attr("href", "https://dyln.returnly.com/");
  }

  if(sVal == 5){
  $('.contact-form-wrap').fadeIn();
  }
        
}); 
  
// Contact page support search
    $('#q-form').submit(function(e) {
      e.preventDefault();
      
      var $qForm = $(this);
      var qS= $qForm.find('#sup-q').val();
      var sUrl = 'https://support.dyln.co/hc/en-us/search?query=' + qS + '&commit=Search';
      $( location ).attr('href', sUrl);
      
      return false;
    });
  
// rating scroll  
  $('.btm-rating .stamped-product-reviews-badge').click(function(){
    $('html, body').animate({
        scrollTop: $('#stamped-main-widget').offset().top - 50
    }, 500);  
  }) 
  
// share popup
	$('a.pop-link').click(function(){
		newwindow=window.open($(this).attr('href'),'','height=300,width=400');
		if (window.focus) { 
			newwindow.focus();
		}
		return false;
	});  

// Submit newsletter 
  $('span.klaviyo_submit_button').click(function(){
   var pForm = $(this).parents('form:first');
    pForm.submit();
  });  
  
  
  
//Check visitor IP Location Function
jQuery.ajax( {
  url: '//freegeoip.net/json/',
  type: 'POST',
  dataType: 'jsonp',
  success: function(location) {
    // If the visitor is browsing from US.
    if (location.country_code === 'US') {
      $('#cart').addClass('loc-us');
     $('#cart li.location-us').addClass('offer-active');
      $('#promo .loca-us').addClass('offer-active');
      $('#promo-sub .sub-us').addClass('offer-active');
    }else{
      $('#cart').addClass('loc-other');
     $('#cart li.location-other').addClass('offer-active');
      $('#promo .loca-other').addClass('offer-active');
      $('#promo-sub .sub-other').addClass('offer-active');
    }
  }
} ); 

// #cart testimonial active
  
  $(function(){
 	var pos = Math.floor(Math.random() * 3) + 1; 
    $(".cart-tes-content-ul li:nth-child("+pos+")").addClass("tes-active");
  });  
  

var url = "https://cdn-stamped-io.azureedge.net/files/widget.min.js";
$.getScript( url, function() {});

$(function() {
  var psUrl = window.location.href;
  if( psUrl == "https://www.dyln.co/products/dyln-living-alkaline-stainless-steel-water-bottle/#design" ){
  window.setTimeout(function(){ $(".cart-button").click(); }, 100);
  }


});  
  
}  