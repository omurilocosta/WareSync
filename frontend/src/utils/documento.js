export function somenteNumeros(valor = '') {
    return valor.replace(/\D/g, '');
}

export function validarCPF(valor) {
    const cpf = somenteNumeros(valor);

    if (cpf.length !== 11) {
        return false;
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i += 1) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let digito = (soma * 10) % 11;

    if (digito === 10) {
        digito = 0;
    }

    if (digito !== Number(cpf[9])) {
        return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i += 1) {
        soma += Number(cpf[i]) * (11 - i);
    }

    digito = (soma * 10) % 11;

    if (digito === 10) {
        digito = 0;
    }

    return digito === Number(cpf[10]);
}

export function validarCNPJ(valor) {
    const cnpj = somenteNumeros(valor);

    if (cnpj.length !== 14) {
        return false;
    }

    if (/^(\d)\1{13}$/.test(cnpj)) {
        return false;
    }

    function calcularDigito(base, pesos) {
        const soma = base
        .split('')
        .reduce(
            (total, numero, indice) =>
            total + Number(numero) * pesos[indice],
            0
        );

        const resto = soma % 11;

        return resto < 2 ? 0 : 11 - resto;
    }

    const primeiro = calcularDigito(
        cnpj.slice(0, 12),
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    if (primeiro !== Number(cnpj[12])) {
        return false;
    }

    const segundo = calcularDigito(
        cnpj.slice(0, 13),
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    return segundo === Number(cnpj[13]);
}

export function validarDocumento(valor) {
    const documento = somenteNumeros(valor);

    if (documento.length === 11) {
        return validarCPF(documento);
    }

    if (documento.length === 14) {
        return validarCNPJ(documento);
    }

    return false;
}

export function formatarDocumento(valor) {
    const numeros = somenteNumeros(valor).slice(0, 14);

    if (numeros.length <= 11) {
        return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    return numeros
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatarTelefone(valor = '') {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    if (numeros.length <= 10) {
        return numeros
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return numeros
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
}

export function validarTelefone(valor = '') {
    const numeros = valor.replace(/\D/g, '');

    return numeros.length === 10 || numeros.length === 11;
}