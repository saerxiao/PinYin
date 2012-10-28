var chineseReader = {
  constants: {
    contentDivId: 'pytext',
    kindleHtmlUrlId: 'akindle',
    pinyinFontSize: '12pt',
    charFontSize: '20pt',
    MIME_TYPE: 'text/html',

    // Constants for the display in Kindle. 
    //
    // The html viewed in Chrome is using floating div to line up the pinyin
    // and Chinese charactor, however, kindle doesn't support floaing div, so I
    // use table to do the line up. Also, Kindle cannot display table across
    // pages properly, so I generate one table per page. Last, it seems Kindle
    // doesn't support font-size in table, so the content can only be displayed
    // in the default size. After trying a few setting, I found these numbers
    // work well for kindle display. 
    //

    charPerRowForKindle: 7,
    rowPerTableForKindle: 22   
  },

  //
  // flow: 1. create style node;
  //       2. if the selectText is not empty, add pinyin to the selected text;
  //       3. if the selectText is empty, try to find the content that the user most likely wants to read, and add pinyin to it;
  //       4. create link for downloading the generated content in html which complies with Kindle;
  //       5. replace the original dom content with the generated content.
  //
  doMainFlow: function(){
    chineseReader.contentDiv = document.getElementById(chineseReader.constants.contentDivId);
    //if the generated content is null, execute the flow, or else do nothing
    if(chineseReader.contentDiv == null){
      chineseReader.contentDiv = document.createElement("div");    
      chineseReader.contentDiv.id = chineseReader.constants.contentDivId;
      chineseReader.createStyle(); 
      chineseReader.selectText = window.getSelection().toString();
      if(chineseReader.selectText != ""){
        console.log("selection true!");
        chineseReader.doProcessText(chineseReader.selectText);
        chineseReader.createDownloadHtml4KindleLink();
        chineseReader.addGeneratedContentToPage();
      }   
      else{
        console.log("selection false.");  
        chineseReader.allTextNodes = [];
        chineseReader.getAllTextNodes(document.body);
        chineseReader.grabContent(chineseReader.allTextNodes);
        chineseReader.createTranslation(chineseReader.contentnode);
        chineseReader.createDownloadHtml4KindleLink();
        chineseReader.addGeneratedContentToPage();  
      }
    }
   
  },

  //
  // Create the style for the html viewed in Chrome. 
  // Set the float property for the div to ensure pinyin and the Chinese charactor line up
  // Set the font size for the pinyin and the Chinese charactor to make them look nicer
  // 
  createStyle: function(){
    chineseReader.style = document.createElement("style");
    var pmiddleStyle = ".pm{float: left; margin: 0 10px 0 0}";
    var linebrStyle = ".linebr{clear:both}";
    var pyStyle = ".py{float: left; font-size:" + chineseReader.constants.pinyinFontSize + "}";
    var chStyle = ".ch{float: left; font-size:" + chineseReader.constants.charFontSize + "}";
    chineseReader.style.innerHTML = pmiddleStyle + linebrStyle + pyStyle + chStyle;
  },

  addGeneratedContentToPage: function(){
    var title = document.title;
    document.head.innerHTML = "";
    document.head.appendChild(chineseReader.style);
    document.body.innerHTML = "";
  
    //create a table, three columns,  put the content in the center pane
    var centerPane = document.createElement("div");
    centerPane.style.margin = "0px auto";
    centerPane.style.width = "50%";
    centerPane.style.maxWidth = "700px";
    
    var banner = document.createElement("div");
    chineseReader.kindleUrl.style.float = "left";
    banner.appendChild(chineseReader.kindleUrl);
    var reloadAnchor = document.createElement('a');
    reloadAnchor.href = document.location.href;
    reloadAnchor.style.float = "right";
    var reloadBtn = document.createElement("input");
    reloadBtn.type = "button";
    reloadBtn.value = "Original Page";
    reloadAnchor.appendChild(reloadBtn);
    banner.appendChild(reloadAnchor);
    centerPane.appendChild(banner);

    var uphr = document.createElement("hr");
    uphr.style.clear = "both";
    centerPane.appendChild(uphr);
    var h1Title = document.createElement("h1");
    h1Title.innerHTML = title;
    centerPane.appendChild(h1Title);
    var lowhr = document.createElement("hr");
    centerPane.appendChild(lowhr);
    centerPane.appendChild(chineseReader.contentDiv);
    
    var bottomhr = document.createElement("hr");
    centerPane.appendChild(bottomhr);
    var appPageAnchor = document.createElement('a');
    appPageAnchor.href = "https://chrome.google.com/webstore/detail/add-pinyin-to-chinese-tex/plfmdhighkfhkicdfkndnjobgpnlimkb";
    var msgDiv = document.createElement("div");
    msgDiv.innerHTML = "Created with the <a href=\"https://chrome.google.com/webstore/detail/add-pinyin-to-chinese-tex/plfmdhighkfhkicdfkndnjobgpnlimkb\">Pin Yin Chrome Extension</a>";
    msgDiv.style.fontSize = "10pt";
    msgDiv.style.float = "right";
    centerPane.appendChild(msgDiv);
    document.body.appendChild(centerPane);
  },
   
  createDownloadHtml4KindleLink: function(){
    var bb = chineseReader.createDownload4KidleURLBlob();
    chineseReader.kindleUrl =  chineseReader.createDownloadLink(bb,  "Download HTML for kindle", chineseReader.constants.kindleHtmlUrlId);
  },
 
  //
  // @return: a Blob object to store the html data for kindle
  // 
  createDownload4KidleURLBlob: function(){
    var tableArray = chineseReader.createContentForKindle();
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;  
    var bb = new BlobBuilder();
    var htmlContent = "<html>\n<head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n</head>\n<body>\n";
    for(var i=0; i<tableArray.length; i++){
       htmlContent = htmlContent + tableArray[i] + "\n" + "<mbp:pagebreak></mbp:pagebreak>\n"; //Use <mbp:pagebreak> to force a page break 
    }
    htmlContent = htmlContent +  "\n</body>\n</html>";
    bb.append(htmlContent);
    return bb;
  },

  //
  // Use window.URL.createObjectURL to create a URL string which can be used to
  // reference data stored in the Blob
  //
  // @return: an anchor 
  //
  createDownloadLink: function(bb, linkName, linkId){
    window.URL = window.webkitURL || window.URL;
    var a = document.createElement('a');
    a.download = document.title + ".html";
    a.href = window.URL.createObjectURL(bb.getBlob(chineseReader.constants.MIME_TYPE));
//    a.textContent = linkName;
    a.id = linkId;
    a.dataset.downloadurl = [chineseReader.constants.MIME_TYPE, a.download, a.href].join(':');
    var button = document.createElement('input');
    button.type = "button";
    button.value = linkName;
    a.appendChild(button);
    return a;
  },

  // Create html with pinyin for kindle.
  //
  // Use table to generate the content to ensure the pinyin and the Chinese
  // charactors line up. Need to create one table per page in Kindle as Kindle
  // cannot display
  //
  // <table> across pages properly @return: an array of html table in string 
  //
  createContentForKindle: function(){
    var allText = "";
    if(chineseReader.allTextNodes != null){
      for(var i=0; i< chineseReader.allTextNodes.length; i++){
        allText = allText +  chineseReader.allTextNodes[i].nodeValue;
      }
    }
    else if(chineseReader.selectText != ""){
      allText = chineseReader.selectText;
    }
    return chineseReader.processTextForKindle(allText);
  },

  //
  // @param: a string of all the text that needs to add pinyin
  //
  processTextForKindle: function(text){
    var tableArray = new Array();
    var tableElement;
    var tableRowCount = 1;
    var tableCount = 0;
    var charPerRowCount = 1;
    var pinyinRow, charRow;
    for(var i=0; i<text.length; i++){
        var charCode = text.charCodeAt(i);
        if(tableRowCount == 1){
              tableElement = "<table>";
          }
        if(charCode != 10){         
          var charactor = text.charAt(i); 
          if(charactor != " "){
            var pinyin = dic[charCode];
            if(pinyin == null){
              pinyin = "";
            }
            if(charPerRowCount == 1){
              pinyinRow = "<tr>";
              charRow = "<tr>";
            }
            var pinyin_column = "<td>" + pinyin + "</td>";
            var char_column = "<td>" + charactor + "</td>";
            pinyinRow = pinyinRow + pinyin_column;
            charRow = charRow + char_column;
            charPerRowCount++;
            if(charPerRowCount > chineseReader.constants.charPerRowForKindle){
              tableElement = tableElement + pinyinRow + "</tr>";
              tableElement = tableElement + charRow + "</tr>";
              charPerRowCount = 1;
              tableRowCount = tableRowCount + 2;
            }
            if(tableRowCount > chineseReader.constants.rowPerTableForKindle){
              tableElement = tableElement + "</table>";
              tableArray[tableCount] = tableElement;
              charPerRowCount = 1;
              tableRowCount = 1;
              tableCount++;
            }
          } 
        }
        else{
          if(charPerRowCount > 1){
              tableElement = tableElement + pinyinRow + "</tr>";
              tableElement = tableElement + charRow + "</tr>";
              tableRowCount = tableRowCount + 2;
              charPerRowCount = 1;
            }
           
            var br_row = "<tr> <td>\n</td></tr>";
            tableElement = tableElement + br_row;
            if(tableRowCount >  chineseReader.constants.rowPerTableForKindle){
              tableElement = tableElement + "</table>";
              tableArray[tableCount]=tableElement;
              tableRowCount=1;
              tableCount++;
            }
        }        
      }

    if(tableElement != null && tableRowCount>1){
      if(pinyinRow != null && charPerRowCount>1){
        tableElement = tableElement + pinyinRow + "</tr></table";
        tableElement = tableElement + charRow + "</tr></table>";
      }
      else{
        tableElement = tableElement + "</table>";
      }
      tableArray[tableCount]=tableElement;
    }
    return tableArray;
  },

  //
  // Create the html for viewing in Chrome.
  //
  createTranslation: function(node){
    chineseReader.allTextNodes = [];
    chineseReader.getAllTextNodes(node);  
    console.log("number of text nodes : " + chineseReader.allTextNodes.length);
    for(var i=0; i<chineseReader.allTextNodes.length; i++){
      chineseReader.doProcessText(chineseReader.allTextNodes[i].nodeValue);
      var lineBreaker = document.createElement("div");
      lineBreaker.className = "linebr";
      chineseReader.contentDiv.appendChild(lineBreaker);
    }
  },

  //
  // Use floating div to ensure the pinyin and the Chinese charactor line up properly
  // 
  doProcessText: function(text){
    for(var i=0; i<text.length; i++){
      var charCode = text.charCodeAt(i);
      if(charCode != 10){
        var charactor = text.charAt(i);
        if(charactor != " "){
           var div =  document.createElement("div");
        div.className = "pm";
       
        var pinyin = dic[charCode];
        if(pinyin == null){
          pinyin = "";
        }
        var spanPinyin = document.createElement("span");
        spanPinyin.className = "py";
        spanPinyin.innerHTML = pinyin;
        var spanChar = document.createElement("span");
        spanChar.className = "ch";
        spanChar.innerHTML = charactor;
        div.appendChild(spanPinyin);
        var br = document.createElement("br");
        div.appendChild(br);
        div.appendChild(spanChar);
        chineseReader.contentDiv.appendChild(div);
        }
      }
      else{
        var lineBreaker = document.createElement("div");
        lineBreaker.className = "linebr";
        chineseReader.contentDiv.appendChild(lineBreaker);
      }
    }
  },

  //
  // Grab the content that most likely be what users want to read.
  //
  // plan: 1. add up number of text for their parents 
  //       2. if the highest parent has # of text > 50% (? need experiment) && the second highest 
  //          parent has # of text < 5% (? need experiment), pick the highest one; or else keep doing 
  //          the same procedure recursively, until the selection criteria is satisfied or reaching 
  //          the body node  
  //
  // @Param: all text nodes in the DOM
  //
  grabContent: function(nodes){
    var parentNodes = [];
    for(var i=0; i <nodes.length ; i++){
      var node = nodes[i];
      var parentNode = node.parentNode;
      if(parentNodes.indexOf(parentNode) == -1){
        chineseReader.initNode(parentNode); 
        parentNodes.push(parentNode);
      }     
      parentNode.textLength +=node.textContent.length;     
    }
    var sum = 0;
    var max = 0, maxIndex = 0;
    for(var i=0; i<parentNodes.length; i++){
      var length =  parentNodes[i].textLength;
      sum += length;
      if(max < length){
        max = length;
        maxIndex = i;
      }
    }

    var maxNode =  parentNodes[maxIndex];
    //find the parent containing the second largest # of text
    var tmpList = parentNodes;
    tmpList.splice(maxIndex,1);
    var secondLargest=0;
    for(var i=0; i<tmpList.length;i++){
      var length = tmpList[i].textLength;
      if(secondLargest < length){
        secondLargest = length;
      }
    }
    
    if(maxNode == document.body){
      chineseReader.contentnode = maxNode;
    }
    else if(max > 0.5*sum && secondLargest < 0.05*sum){
      chineseReader.contentnode = maxNode;
    } 
    else{
      chineseReader.grabContent(parentNodes);
    }
  },

  initNode: function (node) {
    node.textLength = 0;
  }, 

  //
  // get all text nodes of an element
  // @param: a dom node 
  // 
  getAllTextNodes: function(elem){
    var children = elem.childNodes;
    if(children.length > 0){
    var tag = elem.tagName;
    if(tag != "A"){
      for(var i=0; i<children.length;i++){
        var child = children.item(i);
        //some display property is set in the css file not directly in the DOM, so use the jquery method $.css to get it
        var display =  $(child).css('display');
        if(display != "none" && display != "inline" && display != "inline-block"){
          chineseReader.getAllTextNodes(children.item(i));
        } 
      }
    }
  }
  else{
    if(elem.nodeName == "#text"){
      chineseReader.allTextNodes.push(elem);
    }
  }
  }
};

chineseReader.doMainFlow();


