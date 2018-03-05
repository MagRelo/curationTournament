import React from 'react'

class selectTable extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedItem: {}
    }
  }

  render () {
    return (<div>
              <table className="pure-table pure-table-horizontal table-100">
                <thead>
                  <tr>
                    <td>Name</td>
                    <td>Price</td>
                    <td>Change&nbsp;(7d)</td>
                  </tr>
                </thead>
                <tbody>

                  {this.props.items.map((item, index) =>{
                    if(!item){ return null }

                    return <tr key={item.symbol}
                      onClick={()=>{this.props.selectRow(index, this.props.action)}}
                      style={{color: item.symbol === this.props.selectedItem.symbol ? 'orange': ''}}>
                        <td> {item.name} ({item.symbol}) </td>
                        <td> $ {item['price_usd']} </td>
                        <td> {item['percent_change_7d']}% </td>
                    </tr>
                  })}

                </tbody>
              </table>
            </div>
  )}
}

export default selectTable;
