

var ChangeView = function(){



    //this._init_data(data)
    //this._init_state()

    this._bindEvents()




};


ChangeView.prototype._bindEvents = function(){

    $(".removeFilterBtn").on("click", function(){
        var filterName = this.id.substring(0, this.id.indexOf("Remove"));
        var option_value = "null";

        controller._apply_filter(filterName, option_value);

    });

    $(".addFilterSelect").on("change", function(){

        var filterName = this.id.substring(0, this.id.indexOf("Select"));
        var option_value = this.value;

        controller._apply_filter(filterName, option_value);

    });

    $("#changeViewModal").on("hidden.bs.modal", function(){
        var report_type = $("#reportTypeSelect option:selected").text().replace(/\s+/g,"");
        console.log(report_type);
        //$.get(report_type)
        window.location = "/" + report_type;
    })

};


ChangeView.prototype._remove_all_options = function(id){
    var select = document.getElementById(id);
    while(select.options.length > 0) {
        select.options[0] = null;
    }

};

ChangeView.prototype._add_option = function(optionText, id) {
    var select = document.getElementById(id);
    var option = document.createElement("option");
    option.value = optionText;
    option.text = optionText;
    select.add(option);
};

ChangeView.prototype._add_all_options = function(option_list, id){
    this._remove_all_options(id);
    option_list.forEach(function(d){
        var option = document.createElement("option");
        option.value = d;
        option.text = d;
        document.getElementById(id).add(option);
    })
};

ChangeView.prototype._option_select = function(optionText, id){
    document.getElementById(id).value = optionText;
};

ChangeView.prototype._set_filter = function(id, option_list, optionText){
    this._add_all_options(option_list, id);
    this._option_select(optionText, id);
}










