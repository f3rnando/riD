iD.ui.Chat = function(map) {

    function toggle(button) {
        chatbox = d3.select('.chat-box');

        if(button.classed('active')){
            button.attr('class','chat-toggle');
            chatbox.attr('style','display:none');
            //console.log('chat disabled')
            //Should we add something to close the socket connection?
        }else{
            button.attr('class','chat-toggle active');
            //console.log('chat activated');
            chatbox.attr('style','display:auto');
        }
    }

    function click(button) {
        console.log('click');
        button = d3.select('.chat-toggle');
        toggle(button);
        
    }

    function error() { }

    
    return function(selection) {

        var button = selection.append('button')
            .attr('tabindex', -1)
            .attr('class', 'chat-toggle')
            .attr('title', t('chat.title'))
            .on('click', click)
            .call(bootstrap.tooltip()
                .placement('left'));

         button.append('span')
             .attr('class', 'icon chat light');
    };
};
