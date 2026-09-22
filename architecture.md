classDiagram
    %% Relaciones principales
    SistemaBancario "1" *-- "*" Cliente : gestiona
    Cliente "1" *-- "*" Producto : posee
    Producto "1" *-- "*" Movimiento : registra
    Producto <|-- Cuenta
    Producto <|-- TarjetaCredito
    Cuenta <|-- CuentaAhorros
    Cuenta <|-- CuentaCorriente

    class SistemaBancario {
        -List~Cliente~ clientes
        -Cliente usuarioAutenticado
        +registrarUsuario(Cliente)
        +iniciarSesion(usuario, password)
        +bloquearCuenta(usuario)
        +gestionarUsuariosCRUD()
    }

    class Cliente {
        -String identificacion
        -String nombreCompleto
        -String celular
        -String usuario
        -String password
        -int intentosFallidos
        -boolean estaBloqueado
        -List~Producto~ productos
        +editarPerfil(datos)
        +cambiarPassword(actual, nueva)
    }

    class Producto {
        <<abstract>>
        -String numeroProducto
        -List~Movimiento~ historial
        +obtenerMovimientos() List
        +registrarMovimiento(tipo, valor)
    }

    class Cuenta {
        <<abstract>>
        #Number saldo
        +consultarSaldo() Number
        +consignar(monto)
        +retirar(monto)*
        +transferir(monto, cuentaDestino)
    }

    class CuentaAhorros {
        -Number TASA_INTERES = 0.015
        +retirar(monto)
    }

    class CuentaCorriente {
        -Number PORCENTAJE_SOBREGIRO = 0.20
        +retirar(monto)
    }

    class TarjetaCredito {
        -Number cupoCredito
        -Number deudaActual
        +realizarCompra(monto, cuotas)
        -calcularTasaInteres(cuotas) Number
        +calcularCuotaMensual(monto, cuotas, tasa) Number
    }

    class Movimiento {
        -Date fechaHora
        -String tipoTransaccion
        -Number valor
    }