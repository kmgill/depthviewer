

/*




 */


var Uploader = function(containerId, fileSelectId, mapSetter) {

    var setImageViaUrl = function(url) {
        var span = document.createElement('span');
        span.innerHTML = ['<img class="tex-image-preview" src="', url,
            '" title="Loaded Image"', '" tex-uploaded="true" tex-isset="true" />'].join('');

        document.getElementById(containerId).innerHTML = "";
        document.getElementById(containerId).insertBefore(span, null);

        mapSetter(url);
    }

    var handleFileSelect = function(evt) {

        var files = evt.target.files || evt.dataTransfer.files;

        for (var i = 0, f; f = files[i]; i++) {
            if (!f.type.match('image.*')) {
                console.info(f.type);
                continue;
            }

            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    setImageViaUrl(e.target.result);
                };
            })(f);
            reader.readAsDataURL(f);
        }
    }

    var onDragOverLeave = function(e) {
        e.stopPropagation();
        e.preventDefault();
    };

    var onDragDrop = function(e) {
        onDragOverLeave(e);
        handleFileSelect(e);
    };

    document.getElementById(containerId).addEventListener("dragover", onDragOverLeave, false);
    document.getElementById(containerId).addEventListener("dragleave", onDragOverLeave, false);
    document.getElementById(containerId).addEventListener("drop", onDragDrop, false);
    document.getElementById(containerId).style.display = "block";

    $( "#"+fileSelectId ).change(function(evt){
        handleFileSelect(evt);
    });



    return {
        setImageViaUrl : setImageViaUrl
    };
};