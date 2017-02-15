// Handling the click event
var tag = document.getElementById('tag')
if(tag) {
  tag.addEventListener('keyup', function(event) {
    event.preventDefault()
    if(event.keyCode == 13) {
      tag.click()
    }
  })
}

var tagA = document.getElementById('tagsAdd')
if (tagA) {
  tag.addEventListener('keyup', function(event) {
    event.preventDefault()
    if(event.keyCode == 13) {
      tag.click()
    }
  })
}

$(function() {
  var date_input = $('input[name="date"]')
  var container = $('.bootstrap-iso form').length > 0 ? $('.bootstrap-iso form').parent() : "body";
  var options = {
    format: 'yyyy/mm/dd',
    container: container,
    todayHighlight: true,
    autoClose: true
  }
  date_input.datepicker(options)
  $('#addnote').on('click', function(e) {
    e.preventDefault()
    $('form[name="userForm"]').attr('action', '/user/addnote')
    $(this.form).submit()
  })
  $('#sendmail').on('click', function(e) {
    e.preventDefault()
    $('form[name="userForm"]').attr('action', '/user/sendmail')
    $(this.form).submit()
  })
})
