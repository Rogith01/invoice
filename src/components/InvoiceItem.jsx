import React from 'react';

const InvoiceItem = ({ id, name, qty, price, onDeleteItem, onEdtiItem, itemOptions, onAddItem }) => {
  const deleteItemHandler = (event) => {
    event.preventDefault();
    onDeleteItem(id);
  };

  const handleChange = (event) => {
    onEdtiItem(event);
  };

  const handleKeyPress = (event, field) => {
    if (event.key === 'Enter') {
      event.preventDefault();  // Prevent default Enter behavior
      if (field === 'name' || field === 'qty' || field === 'price') {
        onAddItem();  // Add a new item when Enter is pressed in any field
      }
    }
  };

  return (
    <tr>
      <td className="w-full">
        <select
          className="w-full rounded border px-2 py-1"
          name="name"
          id={id}
          value={name}
          onChange={handleChange}
          onKeyDown={(e) => handleKeyPress(e, 'name')} // Add new item on Enter key press
        >
          <option value="">Select item</option>
          {itemOptions.map((opt) => (
            <option key={opt.name} value={opt.name}>
              {opt.name}
            </option>
          ))}
        </select>
      </td>
      <td className="min-w-[65px] md:min-w-[80px]">
        <input
          className="w-full rounded border px-2 py-1"
          type="number"
          min="1"
          name="qty"
          id={id}
          value={qty}
          onChange={handleChange}
          onKeyDown={(e) => handleKeyPress(e, 'qty')} // Add new item on Enter key press
        />
      </td>
      <td className="relative min-w-[100px] md:min-w-[150px]">
        <input
          className="w-full text-right rounded border px-2 py-1"
          type="number"
          min="0.01"
          step="0.01"
          name="price"
          id={id}
          value={price}
          onChange={handleChange}
          onKeyDown={(e) => handleKeyPress(e, 'price')} // Add new item on Enter key press
        />
      </td>
      <td className="flex items-center justify-center">
        <button
          className="rounded-md bg-red-500 p-2 text-white shadow-sm hover:bg-red-600"
          onClick={deleteItemHandler}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
};

export default InvoiceItem;
