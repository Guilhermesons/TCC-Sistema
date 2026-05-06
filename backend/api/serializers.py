from rest_framework import serializers
from .models import Cliente, Equipamento, OrdemServico

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

# Repita o padrão acima para EquipamentoSerializer e OrdemServicoSerializer