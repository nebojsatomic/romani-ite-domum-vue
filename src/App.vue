<template>
  <div id="container" class="container">
      <ul id="scene" class="scene unselectable"
      data-friction-x="0.1"
      data-friction-y="0.1"
      data-scalar-x="15"
      data-scalar-y="15">
      <li class="layer" data-depth="0.00"></li>
      <li class="layer" data-depth="0.10"><h1 id="switch-title" class="title"></h1></li>

      <li class="layer" data-depth="0.10">
        <div class="lighthouse depth-10"><img src="/images/L1@2x.png" alt="Network"></div>
      </li>
      <li class="layer" data-depth="0.20">
        <div class="lighthouse depth-20"><img src="/images/L2@2x.png" alt="Network"></div>
      </li>
      <li class="layer" data-depth="0.30">
        <div class="lighthouse depth-30"><img src="/images/L3@2x.png" alt="Network"></div>
      </li>
      <li  class="layer" data-depth="0.30">
        <div id="parallax-overlay" class="layer">
        </div>   
      </li>
    </ul>
    <div><button @click="nextButtonClicked()" id="next-button" class="primary">Next</button></div>
  </div>

</template>

<script setup>

import { onMounted } from 'vue'

import './assets/js/jquery.js'
import './assets/js/jquery.parallax.js'

  function nextButtonClicked(){
    console.log('Next button clicked')
  }

  onMounted(() => {
    console.log('component is mounted')

    // jQuery part
    $('#scene').parallax({
      headtrackr:false,
      //headtrackrPreferDeviceMotion:false,//by default at true
      scalarX: 15.0,
      scalarY: 15.0,
      //headtrackrDisplayVideo:true,
      //headtrackrDebugView: true,
      invertX:false,
      invertY:false,
      headtrackrScriptLocation: "js/headtrackr.min.js",
    });
  
    let sphinxWebsite = {
      parallaxTitle : [{text:"ROMANI", font: "Dela Gothic One"}, { text: "ITE", font: "Dela Gothic One"}, { text: "DOMUM", font: "Dela Gothic One"}],
      fonts: [{font: "Dela Gothic One"}, {font: "Roboto Slab"}, {font: "Staatliches"}, {font: "Dosis"}],
      switchTitle : function() {
        $('#switch-title').css({ fontFamily: sphinxWebsite.parallaxTitle[0].font });
        $(sphinxWebsite.parallaxTitle).each(function(k, v){
  
              setTimeout(function(){
                $('#switch-title').fadeOut(function(){
                  $('#switch-title').css({ fontFamily: v.font }).text(v.text);
                }).fadeIn();
              }, 3000 * k);
          });
  
        let titleInterval = setInterval(function(){
  
          $(sphinxWebsite.parallaxTitle).each(function(k, v){
  
              setTimeout(function(){
                $('#switch-title').fadeOut(function(){
                  $('#switch-title').css({ fontFamily: v.font }).text(v.text);
                }).fadeIn();
              }, 3000 * k);
          });
        }, 3000 * sphinxWebsite.parallaxTitle.length);
      },
  
      popLogoDots: function(numberOfDots) {
  
        for(let i=0; i<numberOfDots; ++i){
  
          let topRN = 0;
          let leftRN = 0;
          let widthRN = 10; // minWidth
          let heightRN = 10; //minHeight
  
          setTimeout(function(){
            topRN = Math.floor((Math.random() * $('#parallax-overlay').height() ) + 1);
            leftRN = Math.floor((Math.random() * $('#parallax-overlay').width() ) + 1);
            widthRN = Math.floor((Math.random() * 50 ));
            heightRN = Math.floor((Math.random() * 50 ));
            console.log(sphinxWebsite.parallaxTitle[ Math.floor((Math.random() * 3 )) ].font);
  
            $('#parallax-overlay').append(`<div id="logo-dot-` + topRN + `" class="logo-dot" class="lighthouse" style="position:absolute;top: ` + topRN + `px; left: ` + leftRN + `px; width: auto; height: ` + heightRN + `px; z-index: -1; "><h1 style="font-family: '` + sphinxWebsite.fonts[ Math.floor((Math.random() * 3 )) ].font + `'; font-size: ` + widthRN + `px;">ROMANI ITE DOMUM</h1></div>`);
            $(`#logo-dot-` + topRN ).addClass('visible');
          }, (numberOfDots/50) * i);
  
          $('.title').closest('li').css({ zIndex: 99999 });
  
        }
  
      }
  
    }
  
    $(window).on('load', function(){
      $('#scene').animate({ opacity: 1}); // show paralax images only afer loading
      setTimeout(function(){
        $('#next-button').click();
        console.log('clicked');
      }, 8900);
    });
  
    sphinxWebsite.switchTitle(); // switch font and text of the text above parallax
  
    $('#next-button').on('click', function(){
      // animate one of the parallax backgrounds and display the logo dot
      console.log('should animate one layer and hide other 2');
      $('.lighthouse:not(".depth-20")').fadeOut();
      $('.lighthouse.depth-20').fadeIn();
      $('.lighthouse.depth-20 img').animate({ width: "300%", height: "300%" });
      sphinxWebsite.popLogoDots(100);
    });

  })
</script>
<style scoped>
</style>
