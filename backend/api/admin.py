from django.contrib import admin
from .models import Cliente, Equipamento # Garanta que Equipamento está importado aqui
from django.contrib import admin
from .models import Cliente, Equipamento, OrdemServico # Garanta a importação dela aqui

admin.site.register(Cliente)
admin.site.register(Equipamento)
admin.site.register(OrdemServico) # <--- Linha nova para liberar no painel