from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, EquipamentoViewSet, OrdemServicoViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'equipamentos', EquipamentoViewSet)
router.register(r'os', OrdemServicoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]