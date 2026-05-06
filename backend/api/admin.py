from django.contrib import admin
from .models import Cliente  # Importe o seu model aqui

# Registre o model para ele aparecer no Admin
admin.site.register(Cliente)