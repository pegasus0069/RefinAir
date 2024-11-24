
clear all;

aod_db_dt=hdfread('MYD04_L2.A2015117.0835.006.2015117234411.hdf', '/AOD_550_Dark_Target_Deep_Blue_Combined');
aod_dt=hdfread('MYD04_L2.A2015117.0835.006.2015117234411.hdf', '/Optical_Depth_Land_And_Ocean');
lat=hdfread('MYD04_L2.A2015117.0835.006.2015117234411.hdf', '/Latitude');
lon=hdfread('MYD04_L2.A2015117.0835.006.2015117234411.hdf', '/Longitude');
lat=double(lat);
lon=double(lon);

aod_db_dt(aod_db_dt==-9999)=NaN;
aod_db_dt=single(aod_db_dt);
aod_db_dt=aod_db_dt*0.001;

aod_dt(aod_dt==-9999)=NaN;
aod_dt=single(aod_dt);
aod_dt=aod_dt*0.001;


figure
% subplot(2,2,4)
axesm miller
% worldmap([-0.5 40.5],[59.5 100.5])
setm(gca, 'MapLatLimit',[min(min(lat)) max(max(lat))],'MapLonLimit',[min(min(lon)) max(max(lon))],...1
'Frame','on','FontSize',12)
setm(gca, 'MlabelLocation', 5, 'PlabelLocation',5,...
'MLabelParallel','north', 'MeridianLabel','on',...
'ParallelLabel','on')
% setm(gca,'MeridianLabel','on');
framem on

geoshow(lat,lon,aod_db_dt,'DisplayType','texturemap')
S = shaperead('C:\Users\rgautam\Google Drive\ACAM_Training_School\cntry02.shp','UseGeoCoords',true);
geoshow([S.Lat], [S.Lon],'color','black','linewidth',0.2);
colorbar('horizon');
h_bar=findobj(gcf,'Tag','Colorbar');
initpos=get(h_bar,'Position');

set(h_bar,'Position',[initpos(1)+initpos(3)*0.25 initpos(2)-0.08+initpos(4)*0.25 initpos(3)*0.5 initpos(4)*0.5]);
set(gca,'linewidth',1,'fontsize',14);
load color_map;
colormap(color_map);

caxis([0 2])
set(gcf,'Color',[1,1,1])
axis off;
box off;