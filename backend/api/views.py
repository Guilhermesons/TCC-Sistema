from rest_framework import viewsets
from .models import Cliente, Equipamento, OrdemServico
from .serializers import ClienteSerializer, EquipamentoSerializer, OrdemServicoSerializer

# Verifique se o nome da classe é EXATAMENTE ClienteViewSet (com C, V e S maiúsculos)
class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

class EquipamentoViewSet(viewsets.ModelViewSet):
    queryset = Equipamento.objects.all()
    serializer_class = EquipamentoSerializer

class OrdemServicoViewSet(viewsets.ModelViewSet):
    queryset = OrdemServico.objects.all()
    serializer_class = OrdemServicoSerializer