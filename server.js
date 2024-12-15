const response = {
    data: {
        errors: [
          'Данный аккаунт уже продается на маркете — https://lzt.market/136056683/'
        ],
        system_info: { visitor_id: 3396463, time: 1725627059 }
      }
    }

    const error = response.data?.errors?.[0] || ((response?.status === 200 || response?.status === 502)? null : 'Технические работы LZT маркета');
    console.log(error)