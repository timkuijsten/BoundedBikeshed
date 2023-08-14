// ==UserScript==
// @name        BoundedBikeshed
// @description Focus on the topic instead of the bike shed.
// @author      Tim Kuijsten
// @license     ISC
// @namespace   netsend.nl
// @supportURL  https://github.com/timkuijsten/BoundedBikeshed
// @match       https://news.ycombinator.com/item?id=*
// @match       https://lobste.rs/s/*
// @match       https://tweakers.net/*/*
// @grant       none
// @version     0.2.0
// ==/UserScript==

'use strict';

// ISC license

// Copyright (C) 2023 Tim Kuijsten
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

(function() {
  var activatethresh = 10;

  // returns the total number of descendants
  function hidesubcommentsLobsters(comments) {
    var totaldescendants = comments.length;
    comments.forEach(function(comment) {
      // first li.comments_subtree is the reaction form and not an existing comment
      if (comment.querySelector('.details') == null) {
        return 0;
      }

      var subcomments = comment.querySelectorAll(':scope > ol.comments > li.comments_subtree');
      var subtotaldescendants = hidesubcommentsLobsters(subcomments)
      totaldescendants += subtotaldescendants;

      if (subcomments.length == 0) {
        return 0;
      }

      var el = document.createElement("span");
      el.textContent = "| ";
      var subel = document.createElement("span")
      subel.style.cursor = 'pointer';

      var title = '';
      if (subcomments.length > 1) {
        title = subcomments.length + " comments";
      } else {
        title = '1 comment';
      }

      title += ' (+' + (subtotaldescendants - subcomments.length) + ')';
      subel.textContent = 'comments';
      subel.title = title;

      el.appendChild(subel);
      comment.querySelector('.details .byline').appendChild(el);

      var subcommentcontainer = comment.querySelector(':scope > ol.comments');

      (function(scc) {
        var visible = false;
        subel.addEventListener('click', function() {
          if (visible) {
            scc.remove();
          } else {
            comment.appendChild(scc)
          }
          visible = !visible;
        })
      })(subcommentcontainer);

      subcommentcontainer.remove();
    });

    return totaldescendants
  }

  function hidesubcommentsTweakers(comment) {
    var descendants = 0;
    var subcomments = comment.querySelectorAll(':scope > twk-reaction');
    if (subcomments.length == 0) {
      return descendants;
    }

    // recurse into all subcomments
    subcomments.forEach(function(subcomment) {
      descendants++;
      descendants += hidesubcommentsTweakers(subcomment);
    });

    var el = document.createElement("twk-reactie")
    var subel = document.createElement("div")

    el.classList.add("reactie");
    el.classList.add("collapsedmarker");
    el.style.cursor = 'pointer';
    el.appendChild(subel);
    subel.classList.add("reactieBody");

    var title = '';
    if (subcomments.length > 1) {
      title = subcomments.length + " reacties";
    } else if (subcomments.length == 1) {
      title = '1 reactie';
    }
    if (subcomments.length > 0) {
      title += ' (+' + (descendants - subcomments.length) + ')';
      subel.textContent = 'Reacties';
      subel.title = title;
    }

    // insert before first subcomment
    comment.insertBefore(el, comment.querySelector(":scope > twk-reaction"));

    var subcommentcontainer = comment;

    (function togglesub(scc) {
      var visible = false;
      el.addEventListener('click', function() {
        if (visible) {
          scc.querySelectorAll(':scope > twk-reaction').forEach(function(el) {
            el.style.display = 'none';
          });
        } else {
          scc.querySelectorAll(':scope > twk-reaction').forEach(function(el) {
            el.style.display = '';
          });
        }
        visible = !visible;
      })
    })(subcommentcontainer);

    subcommentcontainer.querySelectorAll(':scope > twk-reaction').forEach(function(el) {
      el.style.display = 'none';
    });

    return descendants;
  }

  function HNaddbutton(comment, subgroup, nrdescendants) {
    var el = document.createElement("span");
    el.textContent = "| ";
    var subel = document.createElement("span");
    subel.style.cursor = 'pointer';
    var title = '';
    if (subgroup.length > 1) {
      title = subgroup.length + " subcomments";
    } else if (subgroup.length == 1) {
      title = '1 subcomment';
    }
    title += ' (+' + (nrdescendants - subgroup.length) + ')';
    subel.textContent += 'comments';
    subel.title = title;
    el.append(subel);
    comment.querySelector("span.comhead").append(el);
    (function togglesub(sg) {
      var visible = false;
      subel.addEventListener('click', function() {
        if (visible) {
          sg.forEach(function(el) {
            el.classList.add("noshow");
          });
        } else {
          sg.forEach(function(el) {
            el.classList.remove("noshow");
          });
        }
        visible = !visible;
      })
    })(subgroup);
  }
  // return the number of descendants of comment
  function hidesubcommentsHN(comment) {
    var indent = Number(comment.querySelector('td.ind').getAttribute("indent"));
    var curindent;
    var nextcomment = comment.nextElementSibling;
    var subgroup = [];
    var descendants = 0;
    while (nextcomment) {
      // if not a descendant, return
      // if not a child, recurse
      // else add to group of childs
      var tdind = nextcomment.querySelector('td.ind');
      if (tdind == null) {
        if (subgroup.length > 0) {
          HNaddbutton(comment, subgroup, descendants);
        }
        return descendants;
      }
      curindent = Number(tdind.getAttribute("indent"));
      if (curindent <= indent) {
        if (subgroup.length > 0) {
          HNaddbutton(comment, subgroup, descendants);
        }
        return descendants;
      }

      // curindent > indent

      nextcomment.classList.add("noshow");

      if (curindent > indent + 1) {
        var r = hidesubcommentsHN(nextcomment.previousElementSibling);
        while (r--) {
          nextcomment = nextcomment.nextElementSibling;
          descendants++;
        }
        continue;
      }

      // curindent == indent + 1
      subgroup.push(nextcomment);

      nextcomment = nextcomment.nextElementSibling;
      descendants++;
    }
    if (subgroup.length > 0) {
      HNaddbutton(comment, subgroup, descendants);
    }
    return descendants;
  }

  var hostname = window.location.hostname;

  var allcomments;
  if (hostname == "lobste.rs") {
    allcomments = document.querySelectorAll("li.comments_subtree");
    // first li.comments_subtree is the reaction form and not an existing comment
    if (allcomments.length - 1 > activatethresh) {
      hidesubcommentsLobsters(document.querySelectorAll("body > * > ol.comments > li.comments_subtree"));
    }
  } else if (hostname == "tweakers.net") {
    allcomments = document.querySelectorAll("twk-reaction");
    if (allcomments.length > activatethresh) {
      document.querySelectorAll("#reactieContainer > twk-reaction").forEach(function(comment) {
        hidesubcommentsTweakers(comment);
      });
    }
  } else if (hostname == "news.ycombinator.com") {
    allcomments = document.querySelectorAll("table.comment-tree tr.comtr");
    if (allcomments.length > activatethresh) {
      document.querySelectorAll("table.comment-tree tr.comtr").forEach(function(comment) {
        if (Number(comment.querySelector("td.ind").getAttribute("indent")) == 0) {
          hidesubcommentsHN(comment);
        }
      });
    }
  }
})();
