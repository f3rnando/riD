iD.ui.Chat = function(map) {
    function click() {
        //
    }

    function getRoom() { }

    function getGeohash() { }

    function setExtent(position) {
        var extent = iD.geo.Extent([position.coords.longitude, position.coords.latitude])
            .padByMeters(position.coords.accuracy);

        map.centerZoom(extent.center(), Math.min(20, map.extentZoom(extent)));
    }

    function error() { }

    return function(selection) {
        
        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('title', t('chat.title'))
            .on('click', click)
            .call(bootstrap.tooltip()
                .placement('left'));

         button.append('span')
             .attr('class', 'icon chat light');
    };
};
