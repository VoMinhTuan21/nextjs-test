import React, { Fragment, useEffect, useRef, useState } from "react";
import { Grid, Pagination } from "swiper";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import Price from "../../../components/badge/price";
import Button from "../../../components/buttons/button";
import QuantityBtn from "../../../components/buttons/quantity-btn";
import Comment from "../../../components/comment/comment";
import GoBack from "../../../components/icons/go-back";
import GoForward from "../../../components/icons/go-forward";
import Quality from "../../../components/icons/quality";
import ProductImage from "../../../components/Image/product-image";
import Dropdown from "../../../components/inputs/dropdown";
import TitlePage from "../../../components/title-page/title-page";
import { primary } from "../../../styles/color";
import { useForm } from "react-hook-form";
import productApi from "../../../api/product-api";
import "swiper/css";
import "swiper/css/grid";
import "swiper/css/pagination";
import "react-quill/dist/quill.snow.css";
import { useRouter } from "next/router";
import { en, vi } from "../../../translation";
import VariationOptions from "../../../components/variation-option/variationOptions";
import Head from "next/head";
import { useAppDispatch } from "../../../store/hooks";
import { toastError, toastSuccess } from "../../../util/toast";
import { addToCart } from "../../../redux/slices/cart-slice";
import { useSession } from "next-auth/react";
import APP_PATH from "../../../constants/app-path";
import ProductCard from "../../../components/card/product-card";
import GroupStars from "../../../components/comment/group-stars";
import Image from "next/image";

interface Props {
	productId: string;
	selectedItem: IProductItemDetail | undefined;
	descriptions: ITranslation[];
	productItems: IProductItemDetail[];
	variationList: IVariationList[];
}

export const getServerSideProps = async (context: any) => {
	const productId = context.query.productId as string;
	const itemId = context.query.itemId as string;

	// fetch product
	const response = await productApi.getProductDetal(productId, itemId);
	const { descriptions, productItems, variationList } = response.data.data;

	const selectedItem = productItems.find((item) => item._id === itemId);

	return {
		props: {
			productId,
			selectedItem,
			descriptions,
			productItems,
			variationList,
		},
	};
};

export default function Product({ productId, selectedItem, descriptions, productItems, variationList }: Props) {
	// State
	const [currItem, setCurrItem] = useState<IProductItemDetail | undefined>(selectedItem);
	const [displayImg, setDisplayImg] = useState<string | undefined>(currItem?.thumbnail);
	const [quantity, setQuantity] = useState<number>(1);
	const [similarProds, setSimilarProds] = useState<IProductItem[]>([]);
	const [ratingProdItem, setRatingProdItem] = useState<IRatingProductItem>();
	const [commentPagination, setCommentPagination] = useState<ICommentPagination>();
	const [currPage, setCurrPage] = useState<number>(1);
	const [seletedStar, setSelectedStar] = useState<number>();

	// Ref
	const prodImagesSwiperRef = useRef<SwiperRef>(null);
	const relatedProdsSwiperRef = useRef<SwiperRef>(null);

	// Router & Redux
	const router = useRouter();
	const { locale } = router;
	const content = locale === "en" ? en : vi;
	const dispatch = useAppDispatch();
	const { data: session, status } = useSession();

	// React Hook Form
	const { register } = useForm();

	const handleChangeCurrItem = (item: IProductItemDetail) => {
		setCurrItem(item);
	};

	const handleClickImg = (url: string) => {
		setDisplayImg(url);
	};

	const handleChangeQuantity = (value: number) => {
		setQuantity(value);
	};

	const handleDescription = () => {
		const description = descriptions.find((des) => des.language === locale);
		if (description) {
			let descipt = description.value;
			descipt = descipt.replaceAll("<h1>", '<h1 class="py-2 text-heading-1 dark:text-white">');
			descipt = descipt.replaceAll("<h2>", '<h2 class="py-2 text-heading-2 dark:text-white">');
			descipt = descipt.replaceAll("<h3>", '<h3 class="py-2 text-heading-3 dark:text-white">');
			descipt = descipt.replaceAll("<h4>", '<h4 class="py-2 text-heading-4 dark:text-white">');
			descipt = descipt.replaceAll("<h5>", '<h5 class="py-2 text-heading-5 dark:text-white">');
			descipt = descipt.replaceAll("<h6>", '<h6 class="py-2 text-heading-6 dark:text-white">');
			descipt = descipt.replaceAll("<p>", '<p class="dark:text-white py-2">');
			descipt = descipt.replaceAll("<ul>", '<ul class="list-disc list-inside pl-4">');

			return descipt;
		}
		return "";
	};

	const handleAddToCart = () => {
		if (status === "authenticated") {
			if (currItem) {
				const cartItem: CartItem = {
					itemId: currItem._id,
					productId: productId,
					name: currItem.name,
					price: currItem.price,
					thumbnail: currItem.thumbnail,
					quantity,
				};

				dispatch(addToCart(cartItem));

				toastSuccess("Add to cart success");
			}
		} else {
			router.push({
				pathname: APP_PATH.SIGN_IN,
				query: { redirectURL: router.asPath },
			});
		}
	};

	const handleGetSimilarProds = async () => {
		try {
			if (currItem) {
				const res = await productApi.recommendCF(currItem._id);
				setSimilarProds(res);
			}
		} catch (error) {
			console.log("error: ", error);
			toastError("Have same errors when get similar produts");
		}
	};

	const handleGetRatingProdItem = async () => {
		try {
			if (currItem) {
				const response = await productApi.getRatingType(currItem._id);
				setRatingProdItem(response);
			}
		} catch (error) {
			toastError((error as IResponseError).error);
		}
	};

	const handleSelecteStar = (value: string) => {
		const star = parseInt(value);
		if (star === 0) {
			setSelectedStar(undefined);
		} else {
			setSelectedStar(star);
		}
		handleGetCommentPagination(1, star);
	};

	const handleGetCommentPagination = async (page: number, star?: number) => {
		try {
			if (currItem) {
				const limit = parseInt(process.env.LIMI_COMMENT as string);
				const response = await productApi.getCommentPagination(currItem._id, page, limit, star);
				setCommentPagination(response);
			}
		} catch (error) {
			toastError((error as IResponseError).error);
		}
	};

	useEffect(() => {
		setDisplayImg(currItem?.thumbnail);
		handleGetSimilarProds();
		handleGetRatingProdItem();
		handleGetCommentPagination(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currItem]);

	return (
		<Fragment>
			<Head>
				<title>{currItem?.name.find((item) => item.language == locale)?.value}</title>
			</Head>
			<section
				className="pt-14 md:pt-16 space-y-[104px] md:space-y-[112px] xl:space-y-[144px]
			mb-[104px] md:mb-[112px] xl:mb-[144px]"
			>
				<div className="lg:grid lg:grid-cols-10">
					<div className="md:hidden">
						<Swiper
							slidesPerView={1}
							spaceBetween={40}
							// breakpoints={{
							// 	0: { slidesPerView: 2, spaceBetween: 24 },
							// 	768: { slidesPerView: 4.8, spaceBetween: 24 },
							// 	1024: { slidesPerView: 7, spaceBetween: 24 },
							// }}
							modules={[Pagination]}
							className="mb-10"
							loop
							ref={prodImagesSwiperRef}
						>
							{currItem &&
								[currItem.thumbnail, ...currItem.images].map((url) => (
									<SwiperSlide key={url}>
										<ProductImage src={url} sale={20} />
									</SwiperSlide>
								))}
						</Swiper>
						{/* navigate button */}
						<nav className="flex justify-center gap-x-4 mb-14">
							<button
								onClick={() => prodImagesSwiperRef.current?.swiper.slidePrev()}
								className="p-4 rounded-full bg-gray-accent dark:bg-black-dark-2"
							>
								<GoBack height={16} width={16} className="text-black dark:text-white-light" />
							</button>
							<button
								onClick={() => prodImagesSwiperRef.current?.swiper.slideNext()}
								className="p-4 rounded-full bg-gray-accent dark:bg-black-dark-2"
							>
								<GoForward height={16} width={16} className="text-black dark:text-white-light" />
							</button>
						</nav>
					</div>

					<div className="hidden md:block md:mb-16 lg:mb-0 lg:col-span-4">
						<div className="px-[84px] lg:px-0">
							<ProductImage src={displayImg || "/images/Product.png"} className="mb-6" />

							<div className="grid grid-cols-4 gap-x-2 ">
								{currItem &&
									[currItem.thumbnail, ...currItem.images].map((url) => (
										<ProductImage onClick={() => handleClickImg(url)} key={url} src={url} />
									))}
							</div>
						</div>
					</div>

					{/* product info */}
					<div className="lg:col-span-6 lg:pl-12">
						<TitlePage
							className="mb-6 text-center md:mb-8 lg:text-left"
							subtitle="Bán chạy"
							title={currItem?.name.find((item) => item.language == locale)?.value || ""}
						/>

						<div className="flex justify-center mb-10 lg:justify-start lg:mb-12">
							<Price isResponsive price={currItem?.price || 0} />
						</div>
						{/* variation options */}
						<VariationOptions
							defaultItemId={(selectedItem as IProductItemDetail)?._id}
							productItems={productItems}
							variationList={variationList}
							onChange={handleChangeCurrItem}
						/>

						<div className="flex flex-col items-center gap-6 md:items-stretch md:flex-row md:justify-center">
							<QuantityBtn value={quantity} onChange={handleChangeQuantity} />
							<Button onClick={handleAddToCart} type="primary">
								Thêm vào giỏ
							</Button>
						</div>
					</div>
				</div>

				{/* product info */}
				<div>
					<TitlePage className="text-center xl:text-left " subtitle="Đặc điểm sản phẩm" title="Khám phá các đặc điểm" />
					<div
						className="mt-8 text-paragraph-4 md:text-paragraph-2 dark:text-white"
						dangerouslySetInnerHTML={{
							__html: handleDescription(),
						}}
					></div>
				</div>

				{/* comments */}
				{ratingProdItem && commentPagination && (
					<div className="space-y-4">
						<TitlePage
							className="text-center xl:text-left"
							subtitle="Đánh giá"
							title="Khác hàng của chúng tôi nói gì"
						/>

						<div className="flex justify-between md:justify-evenly">
							<h3 className="grid content-center md:text-heading-1 text-heading-2 dark:text-light-100">
								{`${ratingProdItem.rating} / 5`}
							</h3>
							<div className="space-y-1">
								{[...Array(5)]
									.map((value, index) => {
										const rateTypeFound = ratingProdItem.rateType.find((r) => r.rate === index + 1);
										return (
											<div key={index} className="flex items-center justify-start gap-x-1">
												<GroupStars stars={index + 1} />
												<p className="ml-2 dark:text-light-100 lg:text-heading-3">{rateTypeFound?.count || 0}</p>
											</div>
										);
									})
									.reverse()}
							</div>
						</div>

						<Dropdown
							className="md:w-1/4"
							options={[
								{ label: "Tất cả", value: "0" },
								{ label: "5 sao", value: "5" },
								{ label: "4 sao", value: "4" },
								{ label: "3 sao", value: "3" },
								{ label: "2 sao", value: "2" },
								{ label: "1 sao", value: "1" },
							]}
							onChange={handleSelecteStar}
							register={register}
							name="star"
						/>

						{commentPagination.totalPage > 0 ? (
							<Fragment>
								<div className="lg:grid lg:grid-cols-2">
									{commentPagination.data.map((item) => (
										<Comment key={item._id} comment={item} />
									))}
								</div>
								<div className="flex items-center justify-center gap-x-2">
									<button
										disabled={currPage - 1 < 1}
										onClick={() => {
											handleGetCommentPagination(currPage - 1, seletedStar);
											setCurrPage(currPage - 1);
										}}
										className="disabled:cursor-not-allowed"
									>
										<GoBack className="dark:text-light-100 md:w-5 md:h-5" width={14} height={14} />
									</button>

									<p className="font-semibold text-paragraph-5 md:text-paragraph-4 dark:text-light-100">
										{`${currPage} / ${commentPagination.totalPage}`}
									</p>

									<button
										disabled={currPage + 1 > commentPagination.totalPage}
										onClick={() => {
											handleGetCommentPagination(currPage + 1, seletedStar);
											setCurrPage(currPage + 1);
										}}
										className="disabled:cursor-not-allowed"
									>
										<GoForward className="dark:text-light-100 md:w-5 md:h-5" width={14} height={14} />
									</button>
								</div>
							</Fragment>
						) : (
							<div className="flex flex-col items-center pt-[60px] md:pt-[40px] gap-y-4">
								<p className="text-paragraph-4 md:text-paragraph-2">Không có đánh giá nào</p>
							</div>
						)}
					</div>
				)}

				{/* relative product */}
				<div>
					<div className="md:flex md:justify-between md:mb-16 xl:mb-[72px]">
						<TitlePage
							className="mb-6 text-center md:text-left md:mb-0"
							subtitle="Tìm hiểu thêm"
							title="Sản phẩm tương tự"
						/>

						<div className="hidden md:flex md:gap-x-4 md:items-end">
							<button
								onClick={() => relatedProdsSwiperRef.current?.swiper.slidePrev()}
								className="p-4 rounded-full bg-gray-accent dark:bg-black-dark-2"
							>
								<GoBack height={16} width={16} className="text-black dark:text-white-light" />
							</button>
							<button
								onClick={() => relatedProdsSwiperRef.current?.swiper.slideNext()}
								className="p-4 rounded-full bg-gray-accent dark:bg-black-dark-2"
							>
								<GoForward height={16} width={16} className="text-black dark:text-white-light" />
							</button>
						</div>
					</div>

					<Swiper
						slidesPerView="auto"
						spaceBetween={40}
						breakpoints={{
							0: {
								slidesPerView: 1,
								spaceBetween: 40,
								grid: {
									rows: 1,
								},
							},
							768: {
								slidesPerView: 2,
								spaceBetween: 40,
								grid: {
									rows: 2,
									fill: "row",
								},
							},
							1024: {
								slidesPerView: 4,
								spaceBetween: 40,
								grid: {
									rows: 1,
									fill: "row",
								},
							},
						}}
						modules={[Grid, Pagination]}
						className="mb-10 md:mb-0"
						loop
						ref={relatedProdsSwiperRef}
					>
						{similarProds.map((item) => (
							<SwiperSlide key={item.itemId}>
								<ProductCard productItem={item} />
							</SwiperSlide>
						))}
					</Swiper>

					{/* navigate button */}
					<nav className="flex justify-center gap-x-4 mb-14 md:hidden">
						<button
							onClick={() => relatedProdsSwiperRef.current?.swiper.slidePrev()}
							className="p-4 rounded-full bg-gray-accent dark:bg-black-dark-2"
						>
							<GoBack height={16} width={16} className="text-black dark:text-white-light" />
						</button>
						<button
							onClick={() => relatedProdsSwiperRef.current?.swiper.slideNext()}
							className="p-4 rounded-full bg-gray-accent dark:bg-black-dark-2"
						>
							<GoForward height={16} width={16} className="text-black dark:text-white-light" />
						</button>
					</nav>
				</div>
			</section>
		</Fragment>
	);
}
