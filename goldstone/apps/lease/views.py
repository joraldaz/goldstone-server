# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2012 Solinea, Inc.
#

from datetime import timedelta

from django.core.urlresolvers import reverse
from django.shortcuts import redirect, render
from django.views.generic import ListView
from django.views.generic import CreateView, UpdateView, DeleteView
from django.utils import timezone
from crispy_forms.helper import FormHelper

from .forms import CreateLeaseForm, UpdateLeaseForm
from .models import Lease, Notification, Action


class ListLeaseView(ListView):
    model = Lease
    template_name = 'lease_list.html'


class CreateLeaseView(CreateView):
    model = Lease
    template_name = 'edit_lease.html'
    form_class = CreateLeaseForm

    def get_success_url(self):
        return reverse('lease-list')

    def get_context_data(self, **kwargs):
        context = super(CreateLeaseView, self).get_context_data(**kwargs)
        context['action'] = reverse('lease-new')
        return context

    def form_valid(self, form):
        new_lease = form.instance
        new_lease.deleted = False
        new_lease.status = "pending"
        new_lease.start_time = timezone.now()
        new_lease.save()
        new_action = Action(
            name=form.instance.name,
            driver="terminate",
            time=form.instance.expiration_time,
            result="pending",
            lease=new_lease,
            )
        new_notification = Notification(
            name=form.instance.name,
            driver="email",
            time=form.instance.expiration_time - timedelta(days=2),
            result="pending",
            lease=new_lease,
        )
        new_action.save()
        new_notification.save()
        return super(CreateLeaseView, self).form_valid(form)


class UpdateLeaseView(UpdateView):
    model = Lease
    template_name = 'edit_lease.html'
    form_class = UpdateLeaseForm

    def get_success_url(self):
        return reverse('lease-list')

    def get_context_data(self, **kwargs):
        context = super(UpdateLeaseView, self).get_context_data(**kwargs)
        context['action'] = reverse('lease-edit',
                                    kwargs={'pk': self.get_object().id})
        return context


class DeleteLeaseView(DeleteView):
    model = Lease
    template_name = 'delete_lease.html'

    def get_success_url(self):
        return reverse('lease-list')