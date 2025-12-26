import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import { useToast } from '../components/Toast';

const ProductManager = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        publisher: '',
        author: '',
        price: '',
        stock: 100,
        categoryId: '1',
        genre: '',
        image: '',
        description: '',
        isGiamGia: 0,
        PhanTramGiam: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [bestSellers, setBestSellers] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]); // Kept for consistency if needed later

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [role, setRole] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // DEBUG: Log render
    console.log('ProductManager rendering... Loading:', isLoading);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
            navigate('/admin/login');
            return;
        }
        if (user.role === 'CHAT') {
            navigate('/chat', { replace: true });
            return;
        }
        if (user.role === 'CUSTOMER') {
            navigate('/admin/login');
            return;
        }
        setRole(user.role);

        // Fetch data
        const loadData = async () => {
            try {
                const [prodRes] = await Promise.all([
                    axios.get('/api/products')
                ]);

                // Safe set
                const prodData = Array.isArray(prodRes.data) ? prodRes.data : [];
                setProducts(prodData);

                const sorted = [...prodData].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
                setBestSellers(sorted);

                setIsLoading(false);
            } catch (err) {
                console.error("Init Error:", err);
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // ... (fetch functions) ...

    // ... (fetch functions) ...

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Loading...</div>;

    const fetchTopCustomers = async () => {
        try {
            const res = await axios.get('/api/admin/orders');
            const orders = res.data;
            const customerMap = {};
            orders.forEach(o => {
                if (o.status === 'ThanhCong') {
                    const email = o.customer.email;
                    if (!customerMap[email]) customerMap[email] = { name: o.customer.name, total: 0, count: 0 };
                    customerMap[email].total += o.total;
                    customerMap[email].count += 1;
                }
            });
            const sorted = Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, 5);
            setTopCustomers(sorted);
        } catch (error) {
            console.error('Error fetching top customers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setProducts(res.data);
            const sorted = [...res.data].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
            setBestSellers(sorted);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800; // Limit width
                    const MAX_HEIGHT = 800; // Limit height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    // Compress to JPG 70% quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData(prev => ({ ...prev, image: dataUrl }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setFormData({
            id: '', title: '', publisher: '', author: '', price: '', stock: 100, categoryId: '1', genre: '', image: '', description: '', isGiamGia: 0, PhanTramGiam: 0
        });
        setIsEditing(false);
        setSearchTerm('');
    };

    const handleSelectProduct = (p) => {
        setFormData({
            id: p.id,
            title: p.title,
            publisher: p.publisher || '',
            author: p.author,
            price: p.originalPrice || p.price, // Prefer original price if available (for discounts)
            stock: p.stock,
            categoryId: p.TLID || p.categoryId || '1',
            genre: p.genre,
            image: p.image || '',
            description: p.description || '',
            isGiamGia: p.isGiamGia || 0,
            PhanTramGiam: p.PhanTramGiam || 0
        });
        setIsEditing(true);
        document.querySelector('.product-form-card').scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        try {
            let dataToSend = { ...formData };
            // Sanitize price (replace comma with dot if present)
            if (dataToSend.price) {
                dataToSend.price = dataToSend.price.toString().replace(/,/g, '.');
            }

            if (isEditing) {
                await axios.put(`/api/products/${formData.id}`, dataToSend);
                toast.success('Cập nhật thành công');
            } else {
                await axios.post('/api/products', dataToSend);
                toast.success('Thêm mới thành công');
            }
            fetchProducts();
            resetForm();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Có lỗi xảy ra';
            const detail = error.response?.data?.error?.sqlMessage || error.response?.data?.error?.code || error.message;
            toast.error(`${msg}\nChi tiết: ${detail}`);
        }
    };

    const handleDelete = async () => {
        if (!isEditing || !formData.id) return;
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        try {
            await axios.delete(`/api/products/${formData.id}`);
            toast.success('Xóa thành công');
            fetchProducts();
            resetForm();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Không thể xóa';
            const detail = error.response?.data?.error?.sqlMessage || error.response?.data?.error?.code || error.message;
            toast.error(`${msg}\nChi tiết: ${detail}`);
        }
    };

    const filteredProducts = products.filter(p => {
        const titleMatch = p.title ? p.title.toString().toLowerCase().includes(searchTerm.toLowerCase()) : false;
        const idMatch = p.id ? p.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) : false;
        return titleMatch || idMatch;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);


    const categories = [
        { id: 1, name: 'Trinh thám' },
        { id: 2, name: 'Hài hước' },
        { id: 3, name: 'Phiêu lưu' },
        { id: 4, name: 'Đời thường' }
    ];

    return (
        <div className="admin-container">
            <AdminSidebar active="products" />

            <div className="admin-content">
                <div className="admin-header">
                    <h2 className="page-title">Quản lý sản phẩm</h2>
                    <div className="header-actions">
                        <button className="icon-btn">⚙️</button>
                        <button className="icon-btn">🔔</button>
                        <div className="user-avatar">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card product-form-card">
                        <h3 className="section-title">Sản phẩm mới</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Tên sản phẩm :</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="admin-input" placeholder="Nhập tên sản phẩm..." />
                            </div>

                            <div className="form-group">
                                <label>Tác giả :</label>
                                <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="admin-input" placeholder="..." />
                            </div>
                            <div className="form-group">
                                <label>Nhà xuất bản :</label>
                                <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} className="admin-input" placeholder="..." />
                            </div>

                            <div className="form-group">
                                <label>Mã sản phẩm :</label>
                                <input type="text" name="id" value={isEditing ? formData.id : ''} disabled className="admin-input" placeholder={isEditing ? '' : "Hệ thống đã tạo"} style={{ backgroundColor: '#e9ecef' }} />
                            </div>
                            <div className="form-group">
                                <label>Tồn kho :</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="admin-input" />
                            </div>

                            <div className="form-group">
                                <label>Thể loại :</label>
                                <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="admin-input">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Giá bán :</label>
                                <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="admin-input" placeholder="0" />
                            </div>

                            <div className="form-group">
                                <label>Đang giảm giá? :</label>
                                <select name="isGiamGia" value={formData.isGiamGia} onChange={handleInputChange} className="admin-input">
                                    <option value={0}>Không</option>
                                    <option value={1}>Có</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>% Giảm :</label>
                                <input
                                    type="number"
                                    name="PhanTramGiam"
                                    value={formData.PhanTramGiam}
                                    onChange={handleInputChange}
                                    className="admin-input"
                                    placeholder="0"
                                    disabled={parseInt(formData.isGiamGia) === 0}
                                />
                            </div>

                            <div className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <label style={{ marginBottom: 0, minWidth: '70px', whiteSpace: 'nowrap' }}>Ảnh bìa :</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="file" onChange={handleFileChange} accept="image/*" style={{ color: 'transparent', width: '110px', border: 'none', background: 'transparent', padding: 0 }} />
                                    {formData.image && <img src={formData.image} alt="Preview" style={{ height: '40px', borderRadius: '4px', border: '1px solid #ddd' }} />}
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Mô tả :</label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} className="admin-input" rows="3" placeholder="Mô tả sản phẩm..."></textarea>
                            </div>
                        </div>
                        <div className="form-actions">
                            {!isEditing ? (
                                <button className="btn-success" onClick={handleSubmit}>Thêm</button>
                            ) : (
                                <>
                                    <button className="btn-cancel" onClick={resetForm}>Hủy</button>
                                    <button className="btn-primary" onClick={handleSubmit}>Cập nhật</button>
                                </>
                            )}
                            <button className="btn-secondary" onClick={handleDelete} disabled={!isEditing}>Xóa</button>
                        </div>
                    </div>

                    <div className="card best-sellers-card">
                        <h3 className="section-title">Các sản phẩm bán chạy</h3>
                        {bestSellers.length === 0 ? (
                            <div className="empty-state">
                                <div className="sad-face">☹</div>
                                <p>Không có dữ liệu</p>
                            </div>
                        ) : (
                            <ul className="best-seller-list">
                                {bestSellers.map((p, idx) => (
                                    <li key={p.id} className="best-seller-item">
                                        <span className="rank">{idx + 1}</span>
                                        <div className="info">
                                            <h4>{p.title}</h4>
                                            <p>{p.sold} đã bán</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px', marginBottom: '15px' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>Các sản phẩm ({filteredProducts.length}) :</h3>
                    <div className="search-bar" style={{ width: '300px' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên truyện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="products-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Mã sản phẩm</th>
                                <th>Tên sản phẩm</th>
                                <th>Thể loại</th>
                                <th>Nhà xuất bản</th>
                                <th>Tác giả</th>
                                <th>Giá bán</th>
                                <th>Tồn kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        <div className="empty-state" style={{ padding: '40px' }}>
                                            <div className="sad-face">☹</div>
                                            <p>Không tìm thấy sản phẩm nào</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentProducts.map(p => (
                                    <tr key={p.id} onClick={() => handleSelectProduct(p)} className="clickable-row">
                                        <td>{p.id}</td>
                                        <td>{p.title}</td>
                                        <td>{p.genre}</td>
                                        <td>{p.publisher || '-'}</td>
                                        <td>{p.author}</td>
                                        <td>{p.price ? parseInt(p.price).toLocaleString('vi-VN') : '0'}đ</td>
                                        <td>{p.stock}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination" style={{ justifyContent: 'center', gap: '5px' }}>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{ color: '#3498db', fontWeight: 'bold' }}
                            >
                                &lt; Trước
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={currentPage === i + 1 ? 'active' : ''}
                                    style={currentPage === i + 1 ? { backgroundColor: '#1a1aff', color: 'white', borderRadius: '8px', width: '30px', height: '30px', padding: 0 } : {}}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{ color: '#3498db', fontWeight: 'bold' }}
                            >
                                Sau &gt;
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductManager;
