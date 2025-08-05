from django.contrib import admin
from .models import   Inbox, Message, Tag, Comment, Task, CalendarEvent, ChannelAccount
from apps.core.models import Client, Domain, User

admin.site.register(Client)
admin.site.register(Domain)
admin.site.register(User)
admin.site.register(Inbox)
admin.site.register(Message)
admin.site.register(Tag)
admin.site.register(Comment)
admin.site.register(Task)
admin.site.register(CalendarEvent)
admin.site.register(ChannelAccount)