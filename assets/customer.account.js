(function (Ajax) {

    'use strict';

    var customerID = document.querySelector('input[name="customer_id"]').value;
    var userInterests = [];

    /**
     * Initialize Page
     */
    function initialize() {
        initializeElements();
        fetchInterests();
        fetchCustomerBottles();
        fetchCustomerDetails();
        fetchOrderTrackingDetails();
        setListeners();
        setTimeout(fetchHullDetails, 1000);
    }

    /**
     * Fetch social media profile details of user using Hull.
     */
    function fetchHullDetails() {
        window.Hull.on("hull.ships.ready", function() {
            Hull.api("me").then(function(account) {
                var profilePicture = account.picture + '&' + account.access_token;
                if (profilePicture.startsWith("https://graph.facebook.com")) {
                    document.querySelector(".prof-pic").src = profilePicture + "&height=250&width=250";
                    document.querySelector(".prof-pic").parentElement.className = "profile-img no-image social-pic";
                }
                // else if (profilePicture.startsWith("https://gravatar.com")) {
                //     profilePicture = profilePicture.split("&d")[0];
                //     document.querySelector(".prof-pic").src = profilePicture + "250x250";
                //     document.querySelector(".prof-pic").parentElement.className = "profile-img no-image social-pic";
                // }
            }).catch(function (error) {
                console.log("Something went wrong", error);
            });
        });
    }

    /**
     *  Initialize elements.
     */
    function initializeElements() {
        // Set date limit for diffuser date picker
        $('#diffuser-start-date').attr('data-date-end-date', moment().add(13, 'days').format('MM/DD/YYYY'));
    }

    /**
     * Set element listeners.
     */
    function setListeners() {
        $('.replace-diffuser-close').on('click', function () {
            location.reload();
        });

        $(document).on("swell:setup", function() {
            var customerDetails = swellAPI.getCustomerDetails();
            var referredCustomersInput = $("#referred-customers-input");
            var sendEmailsBtn = $("#referred-customers-send-btn");

            $('.point-balance').html(Number(customerDetails.pointsBalance).toLocaleString());

            // Referral invite via email input functionality
            $(sendEmailsBtn).click(function() {
                $('#rewards-modal-status').html('');
                $('#rewards-modal-message').html('');

                var emails = referredCustomersInput.val().split(",");
                var onSuccess = function() {
                    $('#rewards-modal-status').html('Success');
                    $('#rewards-modal-message').html('Invite Sent!');
                    $('#referred-customers-input').val('');
                };
                var onError = function(err) {
                    $('#rewards-modal-status').html('Error');
                    $('#rewards-modal-message').html('Please enter a valid email address');
                };

                swellAPI.sendReferralEmails(emails,onSuccess, onError);
            });
        });

        $('#replace-diffuser-form').on('submit', function (e) {
            e.preventDefault();

            var form = $(this);
            var bottleID = form.data('bottle-id');
            var inputs = form.serializeArray();
            var isValid = true;

            inputs.forEach(function(input) {
                if (!input.value)
                    isValid = false;
            });

            inputs.push({ name: 'month', value: (new Date($('#diffuser-start-date').val()).getMonth() + 1) });
            inputs.push({ name: 'year', value: new Date($('#diffuser-start-date').val()).getFullYear() });
            inputs.push({ name: 'day', value: new Date($('#diffuser-start-date').val()).getDate() });

            if (!isValid) {
                return;
            }

            Ajax.post('/bottles/' + bottleID + '/customers/' + customerID + '/consumption/edit/', $.param(inputs))
                .then(function (response) {
                    if (response.status == 'valid') {
                        var formData = $('#replace-diffuser-form').serializeArray();
                        var refillStartDate = formData.find(function (data) { return data.name === 'refill_start_date'; }).value;
                        var refillFrequency = Number(formData.find(function (data) { return data.name === 'refill_frequency'; }).value);
                        var daysUsedPerWeek = Number(formData.find(function (data) { return data.name === 'days_used'; }).value);
                        var today = moment(new Date(), 'YYYY-MM-DD');

                        refillStartDate = moment(new Date(refillStartDate), 'YYYY-MM-DD');

                        var daysRemaining = today.diff(refillStartDate, 'days');
                        var weeksRemaining = daysRemaining / daysUsedPerWeek;
                        var refillsUsed = Math.round(weeksRemaining * refillFrequency * daysUsedPerWeek);
                        var refillsRemaining = 400 - refillsUsed;

                        $('.bottle-done .modal-title').html('Thank you for replacing your diffuser.<br>You now have 400 refills left!');
                        $('.bottle-done').css('display', 'block');
                        $('.bottle-form').css('display', 'none');
                    } else {
                        var errors = '';

                        for (var key in response.errors) {
                            response.errors[key].forEach(function (val) {
                                errors += '<span>'+ val +'</span><br />'
                            });
                        }

                        document.querySelector('.refill_start_date_error').innerHTML = errors;
                    }
                }, function (error) {
                    console.log(error);
                });
        });

        $('input[name="replaced-today"]').change(function () {
            if (this.checked) {
                $('#diffuser-start-date').val(moment(new Date()).format('YYYY-MM-DD'));
            }
        });

        $('#diffuser-start-date').change(function () {
            if ($(this).val() !== moment(new Date()).format('YYYY-MM-DD'))
                document.querySelector('input[name="replaced-today"]').checked = false;
            else
                document.querySelector('input[name="replaced-today"]').checked = true;
        });

        // Update Customer Interest Form
        $('.interest-button-submit').on('click', function() {
            var form = document.getElementById('interest-form');
            var selectedInterest = form.querySelectorAll('input:checked');
            var userInterest = [];

            selectedInterest.forEach(function (i) {
                userInterest.push({ name: i.name, value: i.value });
            });

            Ajax.post('/customers/'+ customerID +'/interests/edit/', $.param(userInterest))
                .then(function (response) {
                    if (response.status == 'valid') {
                        location.reload();
                    } else {
                        var errorEle = document.querySelector('#interestsModal .error');
                        errorEle.classList.remove('hidden');
                        errorEle.innerHTML = response.errors["interests"][0]; // Let's hard code the indices for now  since we are only returning 1 possible error.
                    }
                }, function (error) {
                    console.log(error);
                });
        });
    }

    /**
     * Fetch and display customer's registered bottles.
     */
    function fetchCustomerBottles() {
        Ajax.get('/customers/'+ customerID +'/bottles/json/')
            .then(function (response) {
                var replaceButton = '';
                var template = '';

                if (!$.isEmptyObject(response)) {
                    response.forEach(function (val) {
                        var diffuserReplacementDate = moment(val.diffuser_replacement_date);
                        var today = moment(new Date());
                        var dayDifference = diffuserReplacementDate.diff(today, 'days');

                        if (dayDifference <= 12) {
                            document.querySelector('.notif-replace').classList.add('show');

                            if (dayDifference > 0) {
                                document.querySelector('.notif-replace .content-buttoned p').innerHTML = 'Your diffuser needs replacing in the next '+ dayDifference +' days.';
                            }
                            else {
                                document.querySelector('.notif-replace .content-buttoned p').innerHTML = 'Your diffuser needs replacement.';
                            }
                        }

                        var refillsRemaining = Number(val.refills_remaining);
                        var totalRefills = Number(val.total_refills);
                        var percentProgress = Math.round(((refillsRemaining / totalRefills) * 100));
                        var radialColor = 'blue';

                        if (refillsRemaining > 100 && refillsRemaining <= 200)
                            radialColor = 'yellow';
                        else if (refillsRemaining <= 100)
                            radialColor = 'red';

                        var bottleTemplate = document.getElementById('bottle-box-template').cloneNode(true);

                        bottleTemplate.classList.remove('hidden');

                        bottleTemplate.querySelector('.bottle-name').innerHTML = val.nickname;
                        bottleTemplate.querySelector('.bottle-preview').src = val.image;
                        bottleTemplate.querySelector('.refills-remaining').innerHTML = refillsRemaining;
                        bottleTemplate.querySelector('.days-remaining').innerHTML = val.diffuser_days_remaining;
                        bottleTemplate.querySelector('.progress-radial').classList.add('progress-'+ percentProgress, radialColor);

                        bottleTemplate.querySelector('.replaced-diffuser').setAttribute('data-bottle-id', val.id);
                        bottleTemplate.querySelector('.replaced-diffuser').setAttribute('data-days-used', val.days_used);
                        bottleTemplate.querySelector('.replaced-diffuser').setAttribute('data-refill-frequency', val.refill_frequency);
                        bottleTemplate.querySelector('.replaced-diffuser').addEventListener('click', function () {
                            $('.bottle-done').css('display', 'none');
                            $('.bottle-form').css('display', 'block');
                            $('#replace-diffuser-form').attr('data-bottle-id', $(this).data('bottle-id'));
                            $('#replace-diffuser-form #days_used').val($(this).data('days-used'));
                            $('#replace-diffuser-form #refill_frequency').val($(this).data('refill-frequency'));
                            $('#diffuser-start-date').datepicker('setDate', new Date());
                            document.querySelector('input[name="replaced-today"]').checked = true;
                        });

                        bottleTemplate.querySelector('.bottle-info').setAttribute('data-bottle-info', JSON.stringify(val).replace(/'/g, "&prime;"));
                        bottleTemplate.querySelector('.bottle-info').addEventListener('click', function (evt) {
                            var bottleInfo = JSON.parse(this.dataset.bottleInfo);
                            var modal = document.getElementById('bottle-info');

                            // Hide all finish preview images
                            modal.querySelectorAll('.bottle-finish-preview .preview').forEach(function (ele) {
                                ele.classList.add('hidden');
                            });

                            // Display Bottle Info
                            modal.querySelector('.purchase-location').innerHTML = '<i class="fa fa-map-marker" aria-hidden="true"></i> Purchased ' + moment(bottleInfo.purchase_date).format('LL') + ' at ' + bottleInfo.purchase_location.name;
                            modal.querySelector('.bottle-name').innerHTML = bottleInfo.nickname;
                            modal.querySelector('.bottle-finish').innerHTML = bottleInfo.finish.name;
                            modal.querySelector('.bottle-sleeve').innerHTML = bottleInfo.color.name;
                            modal.querySelector('.diffuser-start-date').innerHTML = moment(bottleInfo.refill_start_date).format('LL');
                            modal.querySelector('.diffuser-refills-remaining').innerHTML = bottleInfo.refills_remaining;
                            modal.querySelector('.diffuser-days-remaining').innerHTML = bottleInfo.diffuser_days_remaining;
                            modal.querySelector('.days-per-week').innerHTML = bottleInfo.days_used + ' Days';
                            modal.querySelector('.refills-per-day').innerHTML = bottleInfo.refill_frequency + ' Refills';

                            var daysPerWeekProgress = (Number(bottleInfo.days_used) / 7) * 100;
                            var refillsPerDayProgress = (Number(bottleInfo.refill_frequency) / 7) * 100;

                            modal.querySelector('.days-per-week-progress').style.width = daysPerWeekProgress + '%';
                            modal.querySelector('.refills-per-day-progress').style.width = refillsPerDayProgress + '%';

                            modal.querySelectorAll('.bottle-code').forEach(function (ele) {
                                ele.innerHTML = bottleInfo.code.code;
                            });

                            modal.querySelector('.bottle-finish-preview .' + bottleInfo.finish.name.toLowerCase()).classList.remove('hidden');
                            modal.querySelector('.bottle-sleeve-preview img').src = "/a/dyln" + bottleInfo.color.image;
                            modal.querySelectorAll('.bottle-img').forEach(function (ele) {
                                ele.src = bottleInfo.image;
                            });

                            if (Number(bottleInfo.refills_remaining) <= 200) {
                                modal.querySelector('.replace-diffuser-notif').classList.remove('hidden');

                                if (bottleInfo.refills_remaining == 0) {
                                    modal.querySelector('.replace-diffuser-notif').innerHTML = 'Replace diffuser';
                                } else {
                                    modal.querySelector('.replace-diffuser-notif').innerHTML = 'Replace diffuser soon';
                                }
                            } else {
                                modal.querySelector('.replace-diffuser-notif').classList.add('hidden');
                            }
                        });

                        if (refillsRemaining >= 40)
                            bottleTemplate.querySelector('.purchase-diffuser').classList.add('hidden');

                        document.querySelector('#bottles-list .register-bottle').before(bottleTemplate);
                    });
                }
            }, function (error) {
                console.log(error);
            });
    }

    /**
     * Fetch and display customer details.
     */
    function fetchCustomerDetails() {
        Ajax.get('/customers/'+ customerID +'/json/')
            .then(function (response) {
                var progressBarEle = document.querySelector('#profile-completeness .progress-bar');
                var totalFields = Object.keys(response).length;
                var fieldCount = 0;

                Object.keys(response).forEach(function (key, idx) {
                    if (response[key]) {
                        if (typeof response[key] === 'object') {
                            if (response[key].length) {
                                fieldCount++;
                            }
                        } else if (response[key]) {
                            fieldCount++;
                        }
                    }
                });

                var progress = (fieldCount) ? Math.round(((fieldCount/totalFields) * 100)) + '%' : '0%';

                if (progress !== '100%') {
                    document.querySelector('#profile-completeness.notif-prog-inner').classList.remove('hidden');
                }

                progressBarEle.style.width = progress;
                progressBarEle.innerHTML = progress;

                if (!document.querySelector('.profile-img').classList.contains('social-pic')) {
                    document.querySelector('.profile-img').classList.remove('no-image');
                    document.querySelector('.profile-img').classList.add(response.profile_img);
                }

                document.querySelector('.percent-txt').innerHTML = progress;
            }, function (error) {
                console.log(error);
            });
    }

    /**
     * Fetch and display available interest options.
     */
    function fetchInterests() {
        Ajax.get('/configurations/interests/json/')
            .then(function (response) {
                response.forEach(function (val, key) {
                    var interestsTemplate = document.getElementById('checkbox-wrap-template').cloneNode(true);

                    interestsTemplate.querySelector('.check-img img').src = val.image;
                    interestsTemplate.querySelector('input[name="interests"]').value = val.id;
                    interestsTemplate.querySelector('.interest-name').innerHTML = val.name;
                    interestsTemplate.addEventListener('click', function (e) {
                        var interest = Number(this.querySelector('input[name="interests"]').value);

                        if (this.classList.contains('selected')) {
                            this.classList.remove('selected');
                            this.querySelector('input[name="interests"]').removeAttribute('checked');
                            userInterests.splice(userInterests.indexOf(interest), 1);
                        } else {
                            this.classList.add('selected');
                            this.querySelector('input[name="interests"]').setAttribute('checked', true);
                            userInterests.push(interest);
                        }

                        e.stopPropagation();
                        e.preventDefault();
                    });

                    interestsTemplate.classList.remove('hidden');

                    document.querySelector('.checkbox-interests').appendChild(interestsTemplate);
                });

                fetchCustomerInterests(customerID);
            }, function (error) {
                console.log(error);
            });
    }

    /**
     * Fetch and display user interests.
     */
    function fetchCustomerInterests() {
        Ajax.get('/customers/'+ customerID +'/interests/json/')
            .then(function (response) {
                var interestsTemplate = '';

                response.forEach(function (val, key) {
                    userInterests.push(val.name);
                    interestsTemplate += '<span class="tag">' + val.name + '</span>';
                });

                document.querySelector('.interests-box').innerHTML = interestsTemplate;

                var interestOpts = document.querySelector('.checkbox-interests .checkbox-wrap');
                var userHasInterest = false;

                $.each($('.checkbox-interests .checkbox-wrap'), function(k, v) {
                    if (userInterests.indexOf($(this).find('.interest-name').html()) >= 0) {
                        $(this).click();
                        userHasInterest = true;
                    }
                });

                if (!userHasInterest) {
                    document.querySelector('.no-interest').classList.remove('hidden');
                }
            }, function (error) {
                console.log(error);
                document.querySelector('.no-interest').classList.remove('hidden');
            });
    }

    /**
     * Fetch and display order tracking details
     */
    function fetchOrderTrackingDetails() {
        document.querySelectorAll('.order-right').forEach(function (ele) {
            var orderID = ele.dataset.id;

            Ajax.get('/orders/' + orderID + '/fulfillments/json/')
                .then(function (response) {
                    response.forEach(function (data) {
                        var template = this.querySelector('.tracking-template').cloneNode(true);

                        template.classList.remove('hidden');

                        template.querySelector('.tracking span').innerHTML = data.tracking_numbers;
                        template.querySelector('.tracking a').href = data.tracking_urls;
                        template.querySelector('.cour').href = data.tracking_compnay;

                        this.appendChild(template);
                    });
                }.bind(ele), function (error) {
                    console.log(error);
                });
        });
    }

    // Initialize script
    initialize();

})(Ajax);
