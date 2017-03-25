/*
 * Copyright (c) 2017 Dmytro Meleshko
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
!function(){"use strict";function t(){var t=$(s).parent().width()/A;return s.height=s.width=t,t}function e(){B=[{x:Math.floor(R/2),y:Math.floor(C/2),direction:_.sample(["left","up","right","down"])}],T={x:_.random(R),y:_.random(C)},j=0,r(),q=_.now(),D=!0}function r(){y.html(j),j>F&&(F=j),v.html(F)}function o(){w.strokeStyle="black",w.fillStyle="black",w.clearRect(0,0,s.width,s.height),w.strokeRect(0,0,s.width,s.height),w.fillCircle(T.x,T.y,M/2-1),m.html(_.now()-q+" sec");var t=_.clone(_.tail(B));return n()?void i():(d(),c(t),a(),void(D=!0))}function n(){for(var t=_.head(B),e=1;e<B.length;e++){var r=B[e];if(t.x==r.x&&t.y==r.y)return!0}return!1}function i(){clearInterval(u),clearInterval(f);var t=!0,e=setInterval(function(){if(w.clearRect(0,0,s.width,s.height),w.strokeRect(0,0,s.width,s.height),t)for(var e=0;e<B.length;e++){var r=B[e];w.fillRect(r.x*M,r.y*M,M,M)}t=!t},P);setTimeout(function(){clearInterval(e),b.html(j),k.html(q+" sec"),x.modal("show")},S)}function d(){for(var t=0;t<B.length;t++){var e=B[t];w.fillRect(e.x*M,e.y*M,M,M),"left"==e.direction?e.x--:"up"==e.direction?e.y--:"right"==e.direction?e.x++:"down"==e.direction&&e.y++,e.x=l(e.x,R),e.y=l(e.y,C)}}function c(t){var e=_.head(B);e.x==T.x&&e.y==T.y&&(B.push(t),T={x:_.random(R),y:_.random(C)},j++,r())}function a(){for(var t=B.length-1;t>=1;t--){var e=B[t],r=B[t-1];e.direction=r.direction}}function l(t,e){return t%=e,t<0&&(t=e+t),t}function h(){e(),u=setInterval(o,E)}var u,f,s=document.getElementById("canvas"),w=s.getContext("2d"),y=$("#score-counter"),v=$("#high-score-counter"),m=$("#time-counter"),g=$("#leaderboard > tbody"),x=$("#you-died-modal"),p=$("#you-died-modal #player-name"),b=$("#you-died-modal #statistics-score"),k=$("#you-died-modal #statistics-time"),A=1.1,I=t(),R=30,C=30,M=I/R,E=100,P=150,S=2e3;$(window).on("resize",_.debounce(function(){I=t(),M=s.width/R},E));var z={leftArrow:37,upArrow:38,rightArrow:39,downArrow:40,w:87,a:65,s:83,d:68,enter:13};x.on("shown.bs.modal",function(){p.focus()}),x.on("hidden.bs.modal",function(){var t=p.val();_.isEmpty(t)||g.prepend("<tr><td>"+t+"</td><td>"+j+"</td><td>"+q+" sec</td></tr>"),h()}),p.keyup(function(t){t.keyCode==z.enter&&x.modal("hide")}),w.fillCircle=function(t,e,r){this.beginPath();var o=t*M+r,n=e*M+r;this.arc(o,n,r,0,2*Math.PI),this.fill()};var B,T,j,q,D,F=0;$(document.body).on("keydown",function(t){if(D){D=!1;var e=t.keyCode,r=_.head(B);e!=z.leftArrow&&e!=z.a||"right"==r.direction?e!=z.upArrow&&e!=z.w||"down"==r.direction?e!=z.rightArrow&&e!=z.d||"left"==r.direction?e!=z.downArrow&&e!=z.s||"up"==r.direction||(r.direction="down"):r.direction="right":r.direction="up":r.direction="left"}}),h()}();
//# sourceMappingURL=index.js.map
